({
  access: 'public',
  method: async ({ gameId }) => {
    const game = domain.db.data.game[gameId];
    const user = domain.db.data.user[context.userId];
    domain.db.broadcastData({
      'game': { [gameId]: game },
      'user': { [context.userId]: user },
    });
    return 'ok';
  },
});