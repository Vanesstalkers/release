(Base) =>
  class extends Base {
    channelName;
    constructor(data) {
      const { col, id } = data;
      super(data);
      lib.repository.getCollection(col).set(id, this);
    }
  };
