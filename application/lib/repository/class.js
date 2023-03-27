(Base) =>
  class extends Base {
    channelName;
    constructor(data) {
      const { col, id } = data;
      super(data);
      let store = lib.repository.store.get(col);
      if (!store) {
        store = new Map();
        lib.repository.store.set(col, store);
      }
      store.set(id, this);
    }
  };
