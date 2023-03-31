(col) => {
  let store = lib.repository.store.get(col);
  if (!store) {
    store = new Map();
    lib.repository.store.set(col, store);
  }
  if (!lib.repository[col])
    lib.repository[col] = new Proxy(
      { col },
      {
        get: (data, id) => {
          if (!data[id])
            data[id] = new Proxy(
              { id },
              {
                get: (data, key) => {
                  return Reflect.get(data, key);
                },
                set: (data, key, value) => {
                  const result = Reflect.set(data, key, value);
                  db.mongo.updateOne(col, { _id: id }, { $set: { [key]: value } });
                  return result;
                },
              }
            );
          return Reflect.get(data, id);
        },
        set: (data, id, value) => {
          Reflect.set(data, col, value);
        },
      }
    );
  return store;
};
