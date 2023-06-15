(hash, key, value, { json = false } = {}) =>
  new Promise((resolve, reject) => {
    db.redis.client.hset(hash, key, json ? JSON.stringify(value) : value, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
