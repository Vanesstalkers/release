async () => {
  if (application.worker.id === 'W1') {
    const { lobbyClass } = domain.game;

    new lobbyClass({ id: 'main' });

    db.mongo.handlers.afterStart.push(async () => {
      const lobby = await lib.repository.getCollection('lobby').get('main');
      await lobby.restoreChat();
    });
  }
};
