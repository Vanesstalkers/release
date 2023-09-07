(class LobbyUser extends lib.user.class() {
  async enterLobby({ sessionId, lobbyId }) {
    lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'userEnter', {
      sessionId,
      userId: this.id(),
      name: this.name,
    });

    let { currentTutorial = {}, helper = null, helperLinks = {}, finishedTutorials = {} } = this;

    if (currentTutorial.active?.includes('game-')) {
      this.set({ currentTutorial: null, helper: null });
      helper = null;
    }

    const lobbyStartTutorialName = 'lobby-tutorial-start';
    if (!helper && !finishedTutorials[lobbyStartTutorialName]) {
      const tutorial = lib.helper.getTutorial(lobbyStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      helperLinks = {
        ...{
          menuTop: { selector: '.menu-item.top > label', tutorial: 'lobby-tutorial-links', type: 'lobby' },
          menuChat: { selector: '.menu-item.chat > label', tutorial: 'lobby-tutorial-links', type: 'lobby' },
        },
        ...helperLinks,
      };
      this.set({
        currentTutorial: { active: lobbyStartTutorialName },
        helper,
        helperLinks,
      });
    }

    await this.saveChanges();
  }
  leaveLobby({ sessionId, lobbyId }) {
    const lobbyName = `lobby-${lobbyId}`;
    lib.store.broadcaster.publishAction(lobbyName, 'userLeave', {
      sessionId,
      userId: this.id(),
    });
  }

  async joinGame({ gameId, playerId, gameType, isSinglePlayer }) {
    for (const session of this.sessions()) {
      session.set({ gameId, playerId });
      await session.saveChanges();
      session.send('session/joinGame', { gameId, playerId });
    }

    this.set({
      gameId,
      playerId,
      ...(!this.rankings?.[gameType] ? { rankings: { [gameType]: {} } } : {}),
    });

    let { currentTutorial = {}, helper = null, helperLinks = {}, finishedTutorials = {} } = this;

    if (currentTutorial.active?.includes('lobby-')) {
      this.set({ currentTutorial: null, helper: null });
      helper = null;
    }

    const gameStartTutorialName = isSinglePlayer ? 'game-tutorial-start' : 'game-tutorial-startSingle';
    if (!helper && !finishedTutorials[gameStartTutorialName]) {
      const tutorial = lib.helper.getTutorial(gameStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      helperLinks = {
        ...{
          planeControls: {
            selector: '.gameplane-controls',
            tutorial: 'game-tutorial-links',
            type: 'game',
            pos: { top: false, left: false },
          },
          handPlanes: {
            selector: '.session-player .hand-planes',
            tutorial: 'game-tutorial-links',
            type: 'game',
            pos: { top: true, left: true },
          },
          cardActive: {
            selector: '[code="Deck[card_active]"] .card-event',
            tutorial: 'game-tutorial-links',
            type: 'game',
            pos: { top: false, left: true },
          },
          leaveGame: {
            selector: '.leave-game-btn',
            tutorial: 'game-tutorial-links',
            type: 'game',
            pos: { top: true, left: true },
          },
        },
        ...helperLinks,
      };
      this.set({
        currentTutorial: { active: gameStartTutorialName },
        helper,
        helperLinks,
      });
    }

    await this.saveChanges();
  }
  async leaveGame() {
    const { gameId } = this;
    this.set({ gameId: null, playerId: null });
    await this.saveChanges();

    this.unsubscribe(`game-${gameId}`);
    for (const session of this.sessions()) {
      session.unsubscribe(`game-${gameId}`);
      session.set({ gameId: null, playerId: null });
      await session.saveChanges();
      session.send('session/leaveGame', {});
    }
  }
  async gameFinished({ gameId, gameType, playerEndGameStatus, fullPrice, roundCount, crutchCount }) {
    const endGameStatus = playerEndGameStatus[this.id()];

    const rankings = lib.utils.clone(this.rankings || {});
    if (!rankings[gameType]) rankings[gameType] = {};
    const { games = 0, win = 0, money = 0, crutch = 0, penalty = 0, totalTime = 0 } = rankings[gameType];

    let income = 0;
    let penaltySum = 0;
    if (endGameStatus === 'win') {
      penaltySum = 100 * crutchCount * 1000;
      income = fullPrice * 1000 - penaltySum;
      rankings[gameType].money = money + income;
      rankings[gameType].penalty = penalty + penaltySum;
      rankings[gameType].crutch = crutch + crutchCount;
      rankings[gameType].win = win + 1;
    }
    rankings[gameType].games = games + 1;
    rankings[gameType].totalTime = totalTime + roundCount;
    rankings[gameType].avrTime = Math.floor(rankings[gameType].totalTime / rankings[gameType].win);

    const tutorial = lib.utils.structuredClone(lib.helper.getTutorial('game-tutorial-finished'));
    let incomeText = `${income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₽`;
    if (penaltySum > 0)
      incomeText += ` (с учетом штрафа ${penaltySum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₽)`;
    tutorial[endGameStatus].text = tutorial[endGameStatus].text.replace('[[win-money]]', incomeText);
    this.set({ money: (this.money || 0) + income, helper: tutorial[endGameStatus], rankings });
    await this.saveChanges();
  }
});
