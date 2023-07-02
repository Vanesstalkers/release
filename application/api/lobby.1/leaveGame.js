({
  access: 'public',
  method: async () => {
    try {
      const gameId = context.gameId;
      lib.store('lobby').get('main').removeGame({ _id: gameId, canceledByUser: context.client.userId });

      return 'ok';
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
