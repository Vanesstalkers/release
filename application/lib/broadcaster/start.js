async () => {
  const instance = {
    pubClient: null,
    subClient: null,
    channels: new Map(),
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
    if (channel !== 'updateData') {
      const messageData = JSON.parse(message);
      const { data, directUser, broadcast } = messageData;
      if (directUser) {
        const { emitType } = messageData;
        const { client } = lib.broadcaster.subscribers.get(directUser);
        if (client) client.emit(emitType, { ...data });
      } else if (broadcast === true) {
        // рассылки из broadcastClass-объектов (тип рассылки db/smartUpdated)
        lib.broadcaster.broadcast({ room: channel, data });
      } else {
        // входящие для broadcastClass-объектов
        const instance = lib.broadcaster.channels.get(channel);
        const { eventName, eventData } = messageData;
        if (instance) {
          const event = instance[eventName];
          if (typeof event === 'function') await event.call(instance, eventData);
        }
      }
      return;
    }

    const { roomName, data } = JSON.parse(message);
    const room = instance.rooms.get(roomName);
    if (!room) return;

    const [col, _id] = roomName.split('-');
    const gameData = await db.mongo.findOne(col, _id);
    const owner = await new domain.game.class({ _id }).fromJSON(gameData);
    for (const client of room) {
      const broadcastData = owner.prepareFakeData({ userId: client.userId, data });
      client.emit('db/smartUpdated', broadcastData);
    }
  });
  instance.subClient = subClient;

  Object.assign(lib.broadcaster, instance);
};
