({
  access: 'public',
  method: async ({ gameId }) => {
    if (context.game) return { result: 'error', msg: 'Уже участвует в игре' };

    const { playerId } = await domain.game.joinGame({
      gameId,
      userId: context.userId,
    });

    context.game = gameId.toString();
    context.player = playerId.toString();

    // let gameRoom = domain.game.gameRooms.get(gameId);
    // gameRoom.add(context.client);

    // context.client.events.close.push(()=>{
    //   console.log("context.client.events.close");
    //   gameRoom.delete(context.client);
    // });

    //context.client.emit('game/update', { game });
    //context.client.emit('game/join', {game: gameId});

    return { result: 'success' };
  },
});
