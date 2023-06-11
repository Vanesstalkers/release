({ name: channelName, instance }) => {
  const { subClient, getChannel } = lib.store.broadcaster;
  const channel = getChannel(channelName);
  channel.instance = instance;
  subClient.subscribe(channelName, (err, count) => {
    if (err) throw err;
  });
  return channel;
};
