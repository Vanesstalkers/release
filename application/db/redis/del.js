(key) =>
  new Promise((resolve, reject) => {
    db.redis.client.del(key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
