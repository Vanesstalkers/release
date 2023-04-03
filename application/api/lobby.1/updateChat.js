({
  access: 'public',
  method: async ({ text }) => {
    try {
      const userId = context.client.userId;

      await lib.repository
        .getCollection('lobby')
        .get('main')
        .updateChat({ text, user: { id: userId, name: lib.repository.user[userId].name } });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
