({
  access: 'public',
  method: ({ userName }) => {
    try {
      const userId = context.client.userId;
      const repoUser = lib.repository.user[userId];
      repoUser.name = userName;

      lib.repository.getCollection('lobby').get('main').updateUser({ userId });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
