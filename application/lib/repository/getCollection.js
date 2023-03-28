(col) => {
  let store = lib.repository.store.get(col);
  if (!store) {
    store = new Map();
    lib.repository.store.set(col, store);
  }
  return store;
};
