async () => {
  const instance = {
    pubClient: null,
    subClient: null,
    rooms: new Map(),
    subscribers: new Map(),
  };

  instance.pubClient = new npm.ioredis({ host: 'localhost', port: '6379' });
  const subClient = new npm.ioredis({ host: 'localhost', port: '6379' });

  subClient.subscribe('worker-' + application.worker.id, (err, count) => {
    if (err) throw err;
  });
  subClient.subscribe('updateData', (err, count) => {
    if (err) throw err;
  });
  subClient.on('message', async (channel, message) => {
    const messageData = JSON.parse(message);
    const { data, secureData, directUser, broadcast, emitType } = messageData;
    if (directUser) {
      const { client } = lib.broadcaster.subscribers.get(directUser);
      if (client) client.emit(emitType, { ...data });
    } else if (broadcast === true) {
      // рассылки из broadcastClass-объектов (дефолтный тип рассылки: db/smartUpdated)
      lib.broadcaster.broadcast({ room: channel, data, secureData, emitType });
    } else {
      // входящие для broadcastClass-объектов
      const { instance, clients } = lib.broadcaster.rooms.get(channel);
      const { eventName, eventData } = messageData;
      if (instance) {
        const event = instance[eventName];
        if (typeof event === 'function') await event.call(instance, eventData, clients);
      }
    }
  });
  instance.subClient = subClient;

  Object.assign(lib.broadcaster, instance);
};
