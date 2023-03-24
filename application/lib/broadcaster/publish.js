async (data) => {
  const { pubClient } = lib.broadcaster;
  await pubClient.publish('subscribeOn', JSON.stringify(data)).catch((err) => {
    throw err;
  });
};
