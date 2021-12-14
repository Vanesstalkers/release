({
  access: 'public',
  method: async ({ col, query, options }) => {
    if (typeof query === 'string') query = db.mongo.ObjectID(query);
    else if (query._id && typeof query._id === 'string')
      query._id = db.mongo.ObjectID(query._id);
    const result = await db.mongo.findOne(col, query, options);
    return { result };
  },
});
