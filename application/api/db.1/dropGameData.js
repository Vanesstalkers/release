({
  access: 'public',
  method: async ({ collections }) => {
    for (const col of collections) {
      await db.mongo.client.collection(col).drop();
    }

    await db.mongo.fillGameData();

    return 'ok';
  },
});
