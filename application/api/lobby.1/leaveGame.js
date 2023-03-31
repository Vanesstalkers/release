({
  access: 'public',
  method: async () => {
    try {
      const gameId = context.gameId;
      lib.repository.getCollection('lobby').get('main').removeGame({ _id: gameId });

      return 'ok';
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
