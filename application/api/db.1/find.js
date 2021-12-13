({
  access: 'public',
  method: async ({ col, query, options }) => {
    const result = await db.mongo.find(col, query, options);
    return { result };
  },
});
