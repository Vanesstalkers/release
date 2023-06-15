({
  access: 'public',
  method: async ({ name }) => {
    try {
      const user = lib.store('user').get(context.userId);

      user.name = name;

      await user.saveState();
      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
