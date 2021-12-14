({
  access: 'public',
  method: async () => {
    await db.mongo.fillGameData();

    domain.db.rooms.forEach((room, name) => {
      if (name.includes('game-')) {
        const gameId = name.split('-')[1];
        for (const [client] of room) {
          client.emit('db/updated', {
            game: { [gameId]: domain.db.data.game[gameId] },
          });
        }
      }
    });

    return 'ok';
  },
});
