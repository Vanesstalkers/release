(hash, key, { json = false } = {}) =>
  new Promise((resolve, reject) => {
    db.redis.client.hget(hash, key, (err, result) => {
      if (err) reject(err);
      else resolve(json ? JSON.parse(result) : result);
    });
  });
