({
  access: 'public',
  method: async ({ gameId }) => {
    
    let result = domain.game.list.get(gameId);
    if(!result){
      result = await db.mongo.findOne('game', {_id: db.mongo.ObjectID(gameId)});
      domain.game.list.set(gameId, result);
      domain.game.gameRooms.set(gameId, new Set());
    }

    return { result };
  },
});
