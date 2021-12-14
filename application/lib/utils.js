({
  UNITS: ['', ' Kb', ' Mb', ' Gb', ' Tb', ' Pb', ' Eb', ' Zb', ' Yb'],

  bytesToSize(bytes) {
    if (bytes === 0) return '0';
    const exp = Math.floor(Math.log(bytes) / Math.log(1000));
    const size = bytes / 1000 ** exp;
    const short = Math.round(size, 2);
    const unit = this.UNITS[exp];
    return short + unit;
  },

  UNIT_SIZES: {
    yb: 24, // yottabyte
    zb: 21, // zettabyte
    eb: 18, // exabyte
    pb: 15, // petabyte
    tb: 12, // terabyte
    gb: 9, // gigabyte
    mb: 6, // megabyte
    kb: 3, // kilobyte
  },

  sizeToBytes(size) {
    if (typeof size === 'number') return size;
    const [num, unit] = size.toLowerCase().split(' ');
    const exp = this.UNIT_SIZES[unit];
    const value = parseInt(num, 10);
    if (!exp) return value;
    return value * 10 ** exp;
  },

  clone(item) {
    if (!item) {
      return item;
    } // null, undefined values check

    let types = [Number, String, Boolean],
      result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach((type) => {
      if (item instanceof type) {
        result = type(item);
      } else if (
        item &&
        typeof item === 'object' &&
        item._bsontype === 'ObjectID'
      ) {
        result = db.mongo.ObjectID(item.toString());
      }
    });

    if (typeof result === 'undefined') {
      if (Object.prototype.toString.call(item) === '[object Array]') {
        result = [];
        item.forEach((child, index, array) => {
          result[index] = lib.utils.clone(child);
        });
      } else if (typeof item === 'object') {
        // testing that this is DOM
        if (item.nodeType && typeof item.cloneNode === 'function') {
          result = item.cloneNode(true);
        } else if (!item.prototype) {
          // check that this is a literal
          if (item instanceof Date) {
            result = new Date(item);
          } else {
            // it is an object literal
            result = {};
            for (const i in item) {
              result[i] = lib.utils.clone(item[i]);
            }
          }
        } else {
          // depending what you would like here,
          // just keep the reference, or create new object
          if (false && item.constructor) {
            // would not advice to do that, reason? Read below
            result = new item.constructor();
          } else {
            result = item;
          }
        }
      } else {
        result = item;
      }
    }

    return result;
  },

  dataSearch(data, query, type) {
    // универсальный поиск по массиву объектов

    return Object.values(data || {})[type]((item) => {
      const queryKeys = Object.keys(query).filter(
        (key) => query[key] != undefined
      );

      return (
        queryKeys.filter(
          (key) =>
            (item._meta?.[key] || item[key]) != undefined &&
            (key == '_id' ?
              (item._meta?.[key] || item[key]).toString() ===
                query[key].toString() :
              (item._meta?.[key] || item[key]) === query[key])
        ).length == queryKeys.length
      );
    });
  },

  isObjectID(value) {
    return value && typeof value === 'object' && value._bsontype === 'ObjectID';
  },

  flatten(objectOrArray, prefix = '', formatter = (k) => k) {
    const nestedFormatter = (k) => '.' + k;

    const nestElement = (prev, value, key) =>
      (lib.utils.isObjectID(value) ?
        {
          ...prev,
          ...lib.utils.flatten(
            value,
            `${prefix}${formatter(key)}`,
            nestedFormatter
          ),
        } :
        { ...prev, ...{ [`${prefix}${formatter(key)}`]: value } });

    return Array.isArray(objectOrArray) ?
      objectOrArray.reduce(nestElement, {}) :
      Object.keys(objectOrArray).reduce(
        (prev, element) => nestElement(prev, objectOrArray[element], element),
        {}
      );
  },

  unflatten(data) {
    const result = {};
    for (var i in data) {
      var keys = i.split('.');
      keys.reduce((r, e, j) => (
        r[e] ||
          (r[e] = isNaN(Number(keys[j + 1])) ?
            keys.length - 1 == j ?
              data[i] :
              {} :
            [])
      ), result);
    }
    return result;
  },

  sumPropertiesOfObjects(arrayOfObjects, allowProps = []) {
    return arrayOfObjects.reduce((result, item) => {
      for (const key in item) {
        if (
          item.hasOwnProperty(key) &&
          (allowProps.length === 0 || allowProps.includes(key))
        ) {
          result[key] = (result[key] || 0) + item[key];
        }
      }
      return result;
    }, {});
  },

  addDeepProxyChangesWatcher(sourceObject, path = [], storage = {}) {
    /*
            навешиваем proxy на object-свойства в обратном порядке вложенности (из глубины наверх),
            иначе начнут срабатывать watch-функции еще на этапе создания DeepProxy
        */
    const sourceObjectIsArray = Array.isArray(sourceObject);
    const tmpObject = sourceObjectIsArray ? [] : {};

    for (const key of Object.keys(sourceObject)) {
      const value = sourceObject[key];
      const tmpObjectPropValue =
        //!sourceObjectIsArray && // для массивов не придумал ничего лучше, чем обновлять их целиком
        !lib.utils.isObjectID(value) &&
        value != null &&
        typeof value === 'object' ?
          lib.utils.addDeepProxyChangesWatcher(value, [...path, key], storage)
            .proxy :
          value;

      if (Array.isArray(tmpObject)) tmpObject.push(tmpObjectPropValue);
      else tmpObject[key] = tmpObjectPropValue;
    }

    return {
      storage,
      proxy: new Proxy(tmpObject, {
        set(target, name, value, receiver) {
          console.log('set', { target, name, value, path });
          if (
            !Array.isArray(target) && // для массивов не придумал ничего лучше, чем обновлять их целиком
            !lib.utils.isObjectID(value) &&
            value != null &&
            typeof value === 'object'
          ) {
            target[name] = lib.utils.addDeepProxyChangesWatcher(
              value,
              [...path, name],
              storage
            ).proxy;
          } else {
            target[name] = value;
          }
          sourceObject[name] = value;

          lib.utils.updateStorage({
            target,
            name,
            value,
            path,
            storage,
            sourceObject,
          });

          return true;
        },
        deleteProperty(target, name) {
          console.log('deleteProperty', { target, name });
          delete target[name];
          delete sourceObject[name];

          lib.utils.updateStorage({
            target,
            name,
            value: null,
            path,
            storage,
            sourceObject,
          });

          return true;
        },
      }),
    };
  },
  updateStorage({ target, name, value, path, storage, sourceObject }) {
    if (Array.isArray(target)) {
      // для массивов не придумал ничего лучше, чем обновлять его целиком
      if (name !== 'length') {
        storage[[...path].join('.')] = sourceObject;
      }
    } else {
      const currentKey = [...path, name].join('.');
      let findParentKey = false;
      // проверяем, что текущий ключ не плодит избыточные данные в storage
      Object.keys(storage).forEach((key) => {
        // текущий ключ является родителем более низкого уровня (убираем ключи потомков)
        if (key.indexOf(currentKey + '.') === 0) delete storage[key];
        // текущий ключ является потомком (не добавляем его, а обновляем родителя)
        if (currentKey.indexOf(key + '.') === 0) findParentKey = key;
      });
      if (findParentKey) {
        // найден родитель для текущего ключа, которого нужно обновить
        /*
                    по факту в store уже лежит ссылка на target, который и так обновился,
                    но формально (например, если в store начнет храниться копия) мы должны обновить его вручную
                */
        // storage[findParentKey] = target; - так лучше не делать, потому что при множественном вложении подставится некорректный target
      } else {
        storage[currentKey] = value;
      }
    }
  },
});
