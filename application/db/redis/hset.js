(hash, key, value) =>
  new Promise((resolve, reject) => {
    db.redis.client.hset(hash, key, value, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
