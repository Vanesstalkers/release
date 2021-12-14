({
  access: 'public',
  method: async ({ col, value }) => {
    const result = await db.mongo.insertMany(col, value);
    context.client.emit('db/updated', { col: 'game' });
    return { result };
  },
});
