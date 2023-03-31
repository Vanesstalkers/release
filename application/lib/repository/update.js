async (col, id, data) => {
  await db.mongo.updateOne(col, { _id: id }, { $set: data });
  const store = lib.repository[col];
  Object.assign(store[id], data);
};
