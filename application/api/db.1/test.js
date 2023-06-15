({
  access: 'public',
  method: async () => {
    db.mongo.updateOne(
      'user',
      { _id: db.mongo.ObjectID('6447baa17a01e81904d24a79') },
      { $setOnInsert: { helper2: {}, 'helper2.test': true } },
      { upsert: true }
    );

    return { status: 'ok' };
  },
});
