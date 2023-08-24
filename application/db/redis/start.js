async () => {
  if (application.worker.id === 'W1') {
    console.debug('Connect to redis');
  }
  const client = npm.redis.createClient();
  await client.connect();
  await client.flushDb(); // тут список игроков online и список загруженных игр
  client.on('error', () => {
    if (application.worker.id === 'W1') {
      console.warn('No redis service detected, so quit client');
    }
    client.quit();
  });
  db.redis.client = client;
};
