(Base, { broadcastEnabled = false } = {}) => {
  const extClass =
    broadcastEnabled === false
      ? Base
      : class extends Base {
          #channelName;
          #channel;
          #client;
          #selfBroadcastData;
          constructor(data = {}) {
            const { col, id, client, selfBroadcastData } = data;
            super(data);
            this.#client = client;
            this.#selfBroadcastData = selfBroadcastData;
            if (id) this.initChannel({ col, id });
          }
          initChannel({ col, id } = {}) {
            if (!col) col = this.getCol();
            if (!id) id = this.getId();
            if (!col || !id) throw new Error(`Required is not exist (col=${col}, id=${id})`);

            this.#channelName = `${col}-${id}`;
            this.#channel = lib.store.broadcaster.addChannel({ name: this.#channelName, instance: this });

            // !!! тут нужно восстановить информацию о себе у старых подписчиков
          }
          getClient() {
            return this.#client;
          }
          getChannel() {
            return this.#channel;
          }
          getChannelName() {
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
            this.broadcastData(this.getDataState(), { customChannel: subscriberChannel });
          }
          broadcastData(data, { customChannel } = {}) {
            const wrapPublishData = (data) => ({ [this.getCol()]: { [this.getId()]: data } });

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
            if (this.#selfBroadcastData) {
              if (!customChannel || this.#channelName === customChannel) this.processData(wrapPublishData(data));
            }
          }
        };

  return class extends extClass {
    #id;
    #col;
    #dataState = {};
    #loadError = null;
    #lockedStateJSON = null;

    constructor(data = {}) {
      const { col, id } = data;
      super(data);
      this.#col = col;
      if (id) this.initStore(id);
    }
    initStore(id) {
      this.#id = id.toString();
      lib.store(this.#col).set(this.#id, this);
    }
    loadError() {
      return this.#loadError;
    }
    async load({ fromData = null, fromDB = {} }) {
      if (fromData) {
        Object.assign(this, fromData);
      } else {
        let { id, query } = fromDB;
        if (!query && id) query = { _id: db.mongo.ObjectID(id) };
        if (query) {
          const dbData = await db.mongo.findOne(this.#col, query);
          if (dbData === null) {
            this.#loadError = true;
          } else {
            Object.assign(this, dbData);
            if (!this.#id) {
              this.initStore(dbData._id);
              if (!this.getChannel()) this.initChannel();
            }
          }
        }
      }
      if (this._id) delete this._id; // не должно мешаться при сохранении в mongoDB
      this.fixState();
      return this;
    }
    async create(initialData) {
      const { _id } = await db.mongo.insertOne(this.#col, initialData);
      if (!_id) {
        this.#loadError = true;
      } else {
        Object.assign(this, initialData);
        this.initStore(_id);
        if (!this.getChannel()) this.initChannel();
      }
      if (this._id) delete this._id; // не должно мешаться при сохранении в mongoDB
      this.fixState();
      return this;
    }

    getId() {
      return this.#id;
    }
    getCol() {
      return this.#col;
    }
    getDataState() {
      return this.#dataState;
    }
    fixState({ changes } = {}) {
      if (changes) Object.assign(this.#dataState, changes);
      else this.#dataState = lib.utils.flatten(this);
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
        if (value !== this.#dataState[key] && value?.toString() !== this.#dataState[key]?.toString()) {
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
        const $set = {};
        // защита от ошибки MongoServerError: Updating the path 'XXX.YYY' would create a conflict at 'XXX'
        const changeKeys = Object.keys(changes);
        changeKeys.forEach((key, idx) => {
          if (changeKeys[idx + 1]?.indexOf(`${key}.`) !== 0) $set[key] = changes[key];
        });
        await db.mongo.updateOne(this.#col, { _id: db.mongo.ObjectID(this.#id) }, { $set });
      }
      if (typeof this.broadcastData === 'function') this.broadcastData(changes);

      this.fixState({ changes });
    }
  };
};
