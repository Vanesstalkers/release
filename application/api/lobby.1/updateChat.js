({
  access: 'public',
  method: async ({ text }) => {
    try {
      const userId = context.client.userId;
      const { name } = lib.repository.user[userId];
      if (!name) throw new Error('User name must not be empty');

      await lib.repository
        .getCollection('lobby')
        .get('main')
        .updateChat({ text, user: { id: userId, name } });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
