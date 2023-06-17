(Base, { broadcastEnabled = false } = {}) => {
  const protoClass =
    broadcastEnabled === false
      ? Base
      : class extends Base {
          #channelName;
          #channel;
          #client;
          constructor(data = {}) {
            const { col, id, client } = data;
            super(data);
            this.#client = client;
            if (id) this.initChannel({ col, id });
          }
          initChannel({ col, id } = {}) {
            if (!col) col = this.col();
            if (!id) id = this.id();
            if (!col || !id) throw new Error(`Required is not exist (col=${col}, id=${id})`);

            this.#channelName = `${col}-${id}`;
            this.#channel = lib.store.broadcaster.addChannel({ name: this.#channelName, instance: this });

            // !!! тут нужно восстановить информацию о себе у старых подписчиков
          }
          client() {
            return this.#client;
          }
          channel() {
            return this.#channel;
          }
          channelName() {
            return this.#channelName;
          }
          processAction(data) {
            const { actionName, actionData } = data;
            if (this[actionName]) this[actionName](actionData);
          }
          processData(data) {
            throw new Error(`"processData" handler not created for channel (${this.#channelName})`);
          }
          subscribe(channelName, accessConfig) {
            lib.store.broadcaster.publishAction(channelName, 'addSubscriber', {
              subscriber: this.#channelName,
              accessConfig,
            });
          }
          addSubscriber({ subscriber: subscriberChannel, accessConfig = {} }) {
            this.#channel.subscribers.set(subscriberChannel, { accessConfig });
            this.broadcastData(this.dataState(), { customChannel: subscriberChannel });
          }
          broadcastData(data, { customChannel } = {}) {
            const wrapPublishData = (data) => ({ [this.col()]: { [this.id()]: data } });

            for (const [subscriberChannel, { accessConfig = {} } = {}] of this.#channel.subscribers.entries()) {
              if (!customChannel || subscriberChannel === customChannel) {
                let publishData;
                const { rule = 'all', fields = [] } = accessConfig;
                switch (rule) {
                  case 'fields': // отправляем только выбранные поля
                    publishData = wrapPublishData(
                      Object.fromEntries(Object.entries(data).filter(([key, value]) => fields.includes(key)))
                    );
                    break;
                  case 'all': // отправляем все изменения по всем полям
                  default:
                    publishData = wrapPublishData(data);
                }
                if (!Object.keys(publishData).length) continue;
                lib.store.broadcaster.publishData(subscriberChannel, publishData);
              }
            }
          }
        };

  return class extends protoClass {
    #id;
    #col;
    #dataState = {};
    #lockedStateJSON = null;

    constructor(data = {}) {
      const { col, id } = data;
      super(data);
      this.#col = col;
      if (id) this.initStore(id);
    }
    getProtoParent() {
      let parent = this;
      while (protoClass.prototype.isPrototypeOf(Object.getPrototypeOf(parent))) {
        parent = Object.getPrototypeOf(parent);
      }
      return parent;
    }

    initStore(id) {
      this.#id = id.toString();
      lib.store(this.#col).set(this.#id, this);
    }
    async load({ fromData = null, fromDB = {} }, { initStoreDisabled = false } = {}) {
      if (fromData) {
        Object.assign(this, fromData);
      } else {
        let { id, query } = fromDB;
        if (!query && id) query = { _id: db.mongo.ObjectID(id) };
        if (query) {
          const dbData = await db.mongo.findOne(this.#col, query);
          if (dbData === null) {
            throw 'not_found';
          } else {
            Object.assign(this, dbData);
            if (!this.#id && !initStoreDisabled) {
              this.initStore(dbData._id);
              if (!this.channel()) this.initChannel();
            }
          }
        }
      }
      if (this._id) delete this._id; // не должно мешаться при сохранении в mongoDB
      this.fixState();
      return this;
    }
    async create(initialData = {}) {
      try {
        const { _id } = await db.mongo.insertOne(this.#col, initialData);

        if (!_id) {
          throw 'not_created';
        } else {
          Object.assign(this, initialData);
          this.initStore(_id);
          if (!this.channel()) this.initChannel();
        }
        if (this._id) delete this._id; // не должно мешаться при сохранении в mongoDB
        this.fixState();
        return this;
      } catch (err) {
        throw err;
      }
    }

    id() {
      return this.#id;
    }
    col() {
      return this.#col;
    }
    dataState() {
      return this.#dataState;
    }
    set(key, value) {
      const baseValue = {};
      // если обновляется объект, то ищем все старые вложенные ключи и обнуляем их
      if (typeof value === 'object') {
        const findKey = `${key}.`;
        for (const key of Object.keys(this.dataState())) {
          if (key.indexOf(findKey) === 0) {
            const updateKey = key.replace(findKey, '');
            if (updateKey.includes('.')) delete baseValue[updateKey];
            else baseValue[updateKey] = null;
          }
        }
      }
      // тут происходит замена обнуленных вложенных ключей на новые значения
      this[key] = { ...baseValue, ...value };
    }
    fixState(changes) {
      if (changes) {
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) {
            const findKey = `${key}.`;
            for (const key of Object.keys(this.#dataState)) {
              if (key.indexOf(findKey) === 0) delete this.#dataState[key];
            }
            delete this.#dataState[key];
          } else this.#dataState[key] = value;
        }
      } else this.#dataState = lib.utils.flatten(this);
    }

    lockState() {
      this.#lockedStateJSON = JSON.stringify(this);
    }
    unlockState() {
      for (const key of Object.keys(this)) delete this[key];
      for (const [key, value] of Object.entries(JSON.parse(this.#lockedStateJSON))) this[key] = value;
    }

    getChanges() {
      const currentState = lib.utils.flatten(this);
      const changes = {};
      const restoredKeys = [];
      for (const [key, value] of Object.entries(currentState)) {
        if (
          value !== this.#dataState[key] &&
          ((!Array.isArray(value) && value?.toString() !== this.#dataState[key]?.toString()) || // проверка для объектов '{}'
            (Array.isArray(value) && JSON.stringify(value) !== JSON.stringify(this.#dataState[key]))) // проверять массивы можно только тут, иначе они передаются по ссылке и значение в #dataState всегда совпадает currentState
        ) {
          changes[key] = value;
          if (this.#dataState[key] === null) restoredKeys.push(key);
        } else {
          if (restoredKeys.length && restoredKeys.find((rkey) => key.indexOf(`${rkey}.`) === 0)) {
            changes[key] = this.#dataState[key];
          }
        }
      }
      return changes;
    }

    async saveState() {
      const changes = this.getChanges();
      if (!Object.keys(changes).length) return;
      if (this.#id.length === 24) {
        const $update = { $set: {}, $unset: {} };
        const changeKeys = Object.keys(changes);
        changeKeys.forEach((key, idx) => {
          // защита от ошибки MongoServerError: Updating the path 'XXX.YYY' would create a conflict at 'XXX'
          if (changeKeys[idx + 1]?.indexOf(`${key}.`) !== 0) {
            if (changes[key] === null) $update.$unset[key] = '';
            else $update.$set[key] = changes[key];
          }
        });
        if (Object.keys($update.$set).length === 0) delete $update.$set;
        if (Object.keys($update.$unset).length === 0) delete $update.$unset;
        await db.mongo.updateOne(this.#col, { _id: db.mongo.ObjectID(this.#id) }, $update);
      }
      if (typeof this.broadcastData === 'function') this.broadcastData(changes);

      this.fixState(changes);
    }
  };
};
