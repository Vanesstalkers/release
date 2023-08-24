async (key, value) => await db.redis.client.set(key, value);
