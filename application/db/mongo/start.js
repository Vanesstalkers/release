async () => {
  const client = new npm.mongodb.MongoClient(config.mongo.url, {
    // useUnifiedTopology: true
  });
  await client.connect();
  db.mongo.client = client.db('xaoc3');
  db.mongo.ObjectID = npm.mongodb.ObjectID;

  if (application.worker.id === 'W1') {
    console.debug('Connect to mongo');
    db.mongo.handlers.afterStart.push(async () => {
      console.log('db.mongo.afterStart');
    });
  }
  for (const fn of db.mongo.handlers.afterStart) {
    if (typeof fn === 'function')
      await fn()
  }
};
