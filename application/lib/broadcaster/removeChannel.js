({ name: channelName }) => {
  const { subClient, rooms } = lib.broadcaster;
  rooms.delete(channelName);
  subClient.unsubscribe(channelName, (err) => {
    if (err) throw err;
  });
};
