(col, id) => {
  let instance = lib.repository.getCollection(col).get(id);
  if (instance) return instance;
  instance = {};
  lib.repository.getCollection(col).set(id, instance);
  return instance;
};
