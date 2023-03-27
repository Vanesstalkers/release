async () => {
  if (application.worker.id === 'W1') {
    const { lobbyClass } = domain.game;

    new lobbyClass({ id: 'main' });

    db.mongo.handlers.afterStart.push(async () => {
      const games = await db.mongo.find('game'); // !!! тут проверка на тип игр для восстановления
      //for (const game of games) domain.game.lobby.restoreGame(game);
      const lobby = lib.repository.getStore('lobby', 'main');
      for (const game of games) lobby.restoreGame(game);
    });
  }
};
