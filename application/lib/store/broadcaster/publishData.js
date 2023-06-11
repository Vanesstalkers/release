(channelName, data) => {
  const { pubClient } = lib.store.broadcaster;
  pubClient.publish(
    channelName,
    JSON.stringify({
      processType: 'data',
      data,
    })
  );
};
