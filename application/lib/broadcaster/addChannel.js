async ({ name: channelName, instance }) => {
  const { subClient, channels } = lib.broadcaster;
  channels.set(channelName, instance);
  subClient.subscribe(channelName, (err, count) => {
    if (err) throw err;
  });
};
