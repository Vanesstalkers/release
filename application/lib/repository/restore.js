(col, id, initData) => {
  let instance = lib.repository.getCollection(col).get(id);
  if (instance) return instance;
  Object.assign(lib.repository[col][id], initData);
  instance = {};
  lib.repository.getCollection(col).set(id, instance);
  return instance;
};
