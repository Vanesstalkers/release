({
  access: 'public',
  method: async ({ col, query, options }) => {
    if (typeof query === 'string') query = db.mongo.ObjectID(query);
    else if (query._id && typeof query._id === 'string')
      query._id = db.mongo.ObjectID(query._id);
    const result = await db.mongo.findOne(col, query, options);

    async function find(m, res) {
      for (const [mKey, mValue] of Object.entries(m)) {
        if (res[mKey]) {
          res[mKey].data = await db.mongo.find(res[mKey].col, {
            _id: { $in: res[mKey].l },
          });
          if (Object.keys(mValue).length) {
            for (const item of res[mKey].data) {
              await find(mValue, item);
            }
          }
        }
      }
    }

    await find(
      { __bridge: { __zone: {} }, __plane: { __port: {}, __zone: {} } },
      result
    );

    return { result };
  },
});
