(class LobbySession extends lib.user.session() {
  async gameFinished({ gameId, gameType, playerEndGameStatus }) {
    const user = this.user();
    const endGameStatus = playerEndGameStatus[user.id()];

    const rankings = lib.utils.clone(user.rankings || {});
    if (!rankings[gameType]) rankings[gameType] = {};
    const { games = 0, win = 0, money = 0 } = rankings[gameType];
    rankings[gameType].money = money + 1000;
    rankings[gameType].games = games + 1;
    if (endGameStatus === 'win') rankings[gameType].win = win + 1;


    const tutorial = lib.helper.getTutorial('game-tutorial-finished');
    user.set({ helper: tutorial[endGameStatus], rankings });
    await user.saveChanges();
  }
});
