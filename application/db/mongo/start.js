async () => {
  if (application.worker.id === 'W1') {
    console.debug('Connect to mongo');
  }

  db.mongo.afterStart = [
    async () => {
      console.log('db.mongo.afterStart');
    },
  ];

  const client = new npm.mongodb.MongoClient(config.mongo.url, {
    // useUnifiedTopology: true
  });
  await client.connect();
  db.mongo.client = client.db('xaoc3');
  db.mongo.ObjectID = npm.mongodb.ObjectID;

  if (application.worker.id === 'W1') {
    db.mongo.afterStart.forEach((fn) => fn());
  }

  // const client = npm.redis.createClient();
  // db.redis.client = client;
  // client.on('error', () => {
  //   if (application.worker.id === 'W1') {
  //     console.warn('No redis service detected, so quit client');
  //   }
  //   client.quit();
  // });
};
