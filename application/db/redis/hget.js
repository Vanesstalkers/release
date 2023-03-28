(hash, key) =>
  new Promise((resolve, reject) => {
    db.redis.client.hget(hash, key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
