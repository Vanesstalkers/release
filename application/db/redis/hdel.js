(hash, key) =>
  new Promise((resolve, reject) => {
    db.redis.client.hdel(hash, key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
