(Base) =>
  class extends Base {
    channelName;
    constructor(data, config = {}) {
      let { col, id } = data;
      if (data._id) id = data._id;
      if (config.col) col = config.col;
      super(data, config);
      this.channelName = `${col}-${id}`;
      lib.broadcaster.addChannel({ name: this.channelName, instance: this });
    }
    broadcast(data, secureData, { emitType } = {}) {
      lib.broadcaster.pubClient.publish(
        this.channelName,
        JSON.stringify({ data, secureData, broadcast: true, emitType })
      );
    }
  };
