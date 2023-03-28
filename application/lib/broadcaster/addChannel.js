({ name: channelName, instance }) => {
  const { subClient, getRoom } = lib.broadcaster;
  const room = getRoom(channelName);
  room.instance = instance;
  subClient.subscribe(channelName, (err, count) => {
    if (err) throw err;
  });
};
