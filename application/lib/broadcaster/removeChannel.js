async ({ name: channelName }) => {
  const { subClient, channels } = lib.broadcaster;
  channels.delete(channelName);
  subClient.unsubscribe(channelName, (err) => {
    if (err) throw err;
  });
};
