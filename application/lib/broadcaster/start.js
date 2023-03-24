async () => {
  const instance = {
    pubClient: null,
    subClient: null,
    rooms: new Map(),
    subscribers: new Map(),
  };

  instance.pubClient = new npm.ioredis({ host: 'localhost', port: '6379' });
  const subClient = new npm.ioredis({ host: 'localhost', port: '6379' });
  subClient.subscribe('subscribeOn', 'updateData', (err, count) => {
    if (err) throw err;
  });
  subClient.on('message', async (channel, message) => {
    // console.log({ message });
  });
  instance.subClient = subClient;

  Object.assign(lib.broadcaster, instance);
};
