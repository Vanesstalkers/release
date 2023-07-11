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
            super(...arguments);
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
          removeChannel() {
            // !!! надо настроить удаление канала
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

          /**
           * Базовая функция класса для сохранения данных при получении обновлений
           * @param {*} data
           */
          processData(data) {
            throw new Error(`"processData" handler not created for channel (${this.#channelName})`);
          }
          subscribe(channelName, accessConfig) {
            lib.store.broadcaster.publishAction(channelName, 'addSubscriber', {
              subscriber: this.#channelName,
              accessConfig,
            });
          }
          unsubscribe(channelName) {
            lib.store.broadcaster.publishAction(channelName, 'deleteSubscriber', {
              subscriber: this.#channelName,
            });
          }
          addSubscriber({ subscriber: subscriberChannel, accessConfig = {} }) {
            this.#channel.subscribers.set(subscriberChannel, { accessConfig });
            this.broadcastData(this, { customChannel: subscriberChannel });
          }
          deleteSubscriber({ subscriber: subscriberChannel }) {
            this.#channel.subscribers.delete(subscriberChannel);
          }
          wrapPublishData(data) {
            return { [this.col()]: { [this.id()]: data } };
          }
          broadcastData(data, { customChannel } = {}) {
            for (const [subscriberChannel, { accessConfig = {} } = {}] of this.#channel.subscribers.entries()) {
              if (!customChannel || subscriberChannel === customChannel) {
                let publishData;
                const { rule = 'all', fields = [], pathRoot, path } = accessConfig;
                switch (rule) {
                  /**
                   * фильтруем данные через кастомный обработчик
                   */
                  case 'custom':
                    if (!pathRoot || !path)
                      throw new Error(
                        `Custom rule handler path or pathRoot (subscriberChannel="${subscriberChannel}") not found`
                      );
                    const splittedPath = path.split('.');
                    const method = lib.utils.getDeep(pathRoot === 'domain' ? domain : lib, splittedPath);
                    if (typeof method !== 'function')
                      throw new Error(
                        `Custom rule handler (subscriberChannel="${subscriberChannel}", path="${path}") not found`
                      );
                    publishData = method(data);
                    break;
                  /**
                   * отправляем только выбранные поля (и вложенные в них объекты)
                   */
                  case 'fields':
                    publishData = Object.fromEntries(
                      Object.entries(data).filter(([key, value]) =>
                        fields.find((field) => key === field || key.indexOf(field + '.') === 0)
                      )
                    );
                    break;
                  /**
                   * отправляем все изменения по всем полям
                   */
                  case 'all':
                  default:
                    publishData = data;
                }
                if (!Object.keys(publishData).length) continue;
                lib.store.broadcaster.publishData(subscriberChannel, this.wrapPublishData(publishData));
              }
            }
          }
        };

  return class extends protoClass {
    #id;
    #col;
    #changes = {};
    #disableChanges = false;

    constructor(data = {}) {
      const { col, id } = data;
      super(...arguments);
      this.#col = col;
      if (id) this.initStore(id);
    }
    id() {
      return this.#id;
    }
    col() {
      return this.#col;
    }
    /**
     * При вызове любыми наследниками всегда возвращает protoClass
     */
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
    storeId() {
      return this.#col + '-' + this.#id;
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
        return this;
      } catch (err) {
        throw err;
      }
    }

    set(val, config) {
      if (!this.#disableChanges)
        lib.utils.mergeDeep({
          masterObj: this,
          target: this.#changes,
          source: lib.utils.structuredClone(val),
          config, // все получатели #changes должны знать об удаленных ключах, поэтому ключи с null-значением сохраняем (по дефолту deleteNull = false)
        });
      lib.utils.mergeDeep({
        masterObj: this,
        target: this,
        source: val,
        config: { deleteNull: true, ...config }, // удаляем ключи с null-значением
      });
    }
    markNew(obj) {
      // !!! сомнительная реализация, т.к. эти данные повторно сохранятся в БД
      if (this.#disableChanges) return;
      const col = obj.col;
      const _id = obj._id;
      if (!this.#changes[col]) this.#changes[col] = {};
      this.#changes[col][_id] = obj;
    }
    getChanges() {
      return this.#changes;
    }
    enableChanges() {
      this.#disableChanges = false;
    }
    disableChanges() {
      this.#disableChanges = true;
    }
    clearChanges() {
      this.#changes = {};
    }
    async saveChanges() {
      // !!! тут возникает гонка (смотри публикации на клиенте при открытии лобби после перезагрузки браузера)

      const changes = this.getChanges();
      if (!Object.keys(changes).length) return;
      // let _id = this.#id.length === 24 ? this.#id : '64a2d4a89ba5a1a9fccdbef6';
      // if (_id.length === 24) {
      if (this.#id.length === 24) {
        const $update = { $set: {}, $unset: {} };
        const flattenChanges = lib.utils.flatten(changes);
        const changeKeys = Object.keys(flattenChanges);
        changeKeys.forEach((key, idx) => {
          // защита от ошибки MongoServerError: Updating the path 'XXX.YYY' would create a conflict at 'XXX'
          if (changeKeys[idx + 1]?.indexOf(`${key}.`) !== 0) {
            if (flattenChanges[key] === null) $update.$unset[key] = '';
            else $update.$set[key] = flattenChanges[key];
          }
        });
        if (Object.keys($update.$set).length === 0) delete $update.$set;
        if (Object.keys($update.$unset).length === 0) delete $update.$unset;
        await db.mongo.updateOne(this.#col, { _id: db.mongo.ObjectID(this.#id) }, $update);
        // console.log('db.mongo.updateOne=', { col: this.#col, _id, $update });
        // await db.mongo.updateOne(this.#col, { _id: db.mongo.ObjectID(_id) }, $update);
      }
      if (typeof this.broadcastData === 'function') this.broadcastData(changes);

      this.clearChanges();
    }
  };
};
