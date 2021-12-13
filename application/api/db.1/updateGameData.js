({
  access: 'public',
  method: async ({ col, query, options }) => {
    
    await db.mongo.fillGameData();

    domain.db.rooms.forEach((room, name) => {
      if(name.includes('game-')){
        const gameId = name.split('-')[1];
        for (const [client, access] of room) {
          client.emit('db/updated', { 'game': { [gameId]: domain.db.data.game[gameId] } });
        }
      }
    });

    return 'ok';
  },
});
