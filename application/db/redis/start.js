async () => {
  if (application.worker.id === 'W1') {
    console.debug('Connect to redis');
  }
  const client = npm.redis.createClient();
  db.redis.client = client;
  db.redis.client.flushdb(); // тут только online-list
  client.on('error', () => {
    if (application.worker.id === 'W1') {
      console.warn('No redis service detected, so quit client');
    }
    client.quit();
  });
};
