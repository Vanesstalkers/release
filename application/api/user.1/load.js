({
  access: 'public',
  method: async ({ self } = {}) => {
    try {
      if (!self) throw new Error('Only self load accepted');
      const userId = context.client.userId;
      const user = lib.store('user').get(userId);

      user.broadcastData(user.getDataState(), { customChannel: user.getChannelName() });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
