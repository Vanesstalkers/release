({
  access: 'public',
  method: async ({ gameId }) => {
    const deleteOne = await db.mongo.deleteOne('game', { _id: gameId });
    console.log('deleteOne', deleteOne);
    if (deleteOne == 'ok') {
      delete domain.db.data.game[gameId];
      delete domain.db.forms.lobby.__game[gameId];
      domain.db.broadcast({
        room: 'lobby',
        data: { lobby: domain.db.forms.lobby },
      });
    }
    return { result: 'success' };
  },
});
