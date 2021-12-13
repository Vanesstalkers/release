({
  access: 'public',
  method: async ({ key }) => {
	  console.log({db});
    const result = await db.redis.get(key);
    return { result };
  },
});
