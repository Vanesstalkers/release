async () => {
  if (application.worker.id === 'W1') {
    const { lobbyClass } = domain.game;

    new lobbyClass({ id: 'main' });

    db.mongo.handlers.afterStart.push(async () => {});
  }
};
