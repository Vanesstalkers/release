(Base) =>
  class extends Base {
    channelName;
    constructor(data) {
      const { col, id } = data;
      super(data);
      this.channelName = `${col}-${id}`;
      lib.broadcaster.addChannel({ name: this.channelName, instance: this });
    }
    broadcast(data, secureData) {
      lib.broadcaster.pubClient.publish(this.channelName, JSON.stringify({ data, secureData, broadcast: true }));
    }
  };
