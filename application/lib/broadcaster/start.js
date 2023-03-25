async () => {
  const instance = {
    pubClient: null,
    subClient: null,
    rooms: new Map(),
    subscribers: new Map(),
  };

  instance.pubClient = new npm.ioredis({ host: 'localhost', port: '6379' });
  const subClient = new npm.ioredis({ host: 'localhost', port: '6379' });
  subClient.subscribe('updateData', (err, count) => {
    if (err) throw err;
  });
  subClient.on('message', async (channel, message) => {
    const { roomName, data } = JSON.parse(message);
    const room = instance.rooms.get(roomName);
    if (!room) return;
    
    const [col, _id] = roomName.split('-');
    const gameData = await db.mongo.findOne(col, _id);
    const owner = await new domain.game.class({ _id }).fromJSON(gameData);
    for (const client of room) {
      const broadcastData = owner.prepareFakeData({ userId: client.userId, data });
      client.emit('db/smartUpdated', { ...broadcastData, fromBroadcaster: true });
    }
  });
  instance.subClient = subClient;

  Object.assign(lib.broadcaster, instance);
};
