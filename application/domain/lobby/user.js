(class LobbyUser extends lib.user.class() {
  async enterLobby({ sessionId, lobbyId }) {
    lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'userEnter', {
      sessionId,
      userId: this.id(),
      name: this.name,
      tgUsername: this.tgUsername,
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
      helper = lib.utils.structuredClone(helper, { convertFuncToString: true });
      helperLinks = {
        ...{
          menuTop: {
            selector: '.menu-item.top > label',
            tutorial: 'lobby-tutorial-menuTop',
            simple: false,
            type: 'lobby',
          },
          menuChat: {
            selector: '.menu-item.chat > label',
            tutorial: 'lobby-tutorial-menuChat',
            simple: false,
            type: 'lobby',
          },
          menuGame: {
            selector: '.menu-item.game > label',
            tutorial: 'lobby-tutorial-menuGame',
            simple: false,
            type: 'lobby',
          },
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

  async joinGame({ gameId, playerId, viewerId, gameType, isSinglePlayer }) {
    for (const session of this.sessions()) {
      session.set({ gameId, playerId, viewerId });
      await session.saveChanges();
      session.send('session/joinGame', { gameId, playerId, viewerId });
    }

    this.set({
      ...{ gameId, playerId, viewerId },
      ...(!this.rankings?.[gameType] ? { rankings: { [gameType]: {} } } : {}),
    });

    let { currentTutorial = {}, helper = null, helperLinks = {}, finishedTutorials = {} } = this;

    if (currentTutorial.active?.includes('lobby-')) {
      this.set({ currentTutorial: null, helper: null });
      helper = null;
    }

    const gameStartTutorialName = 'game-tutorial-start';
    if (
      !viewerId && // наблюдателям не нужно обучение
      !helper && // нет активного обучения
      !finishedTutorials[gameStartTutorialName] // обучение не было пройдено ранее
    ) {
      const tutorial = lib.helper.getTutorial(gameStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      helper = lib.utils.structuredClone(helper, { convertFuncToString: true });
      helperLinks = {
        ...{
          gameControls: {
            selector: '.game-controls',
            tutorial: 'game-tutorial-gameControls',
            type: 'game',
            pos: { top: false, left: false },
            simple: false,
          },
          handPlanes: {
            selector: '.session-player .player.iam.active .hand-planes',
            tutorial: 'game-tutorial-links',
            type: 'game',
            pos: { top: true, right: true },
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
    this.set({ gameId: null, playerId: null, viewerId: null });
    await this.saveChanges();

    this.unsubscribe(`game-${gameId}`);
    for (const session of this.sessions()) {
      session.unsubscribe(`game-${gameId}`);
      session.set({ gameId: null, playerId: null, viewerId: null });
      await session.saveChanges();
      session.send('session/leaveGame', {});
    }
  }
  async gameFinished({ gameId, gameType, playerEndGameStatus, fullPrice, roundCount, crutchCount }) {
    if (this.viewerId) {
      this.set({
        helper: {
          text: 'Игра закончена',
          buttons: [{ text: 'Закончить игру', action: 'leaveGame' }],
          actions: {
            leaveGame: (async () => {
              await api.action.call({ path: 'lib.game.api.leave', args: [] }).catch(prettyAlert);
              return { exit: true };
            }).toString(),
          },
        },
      });
      await this.saveChanges();
      return;
    }

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

    const tutorial = lib.utils.structuredClone(lib.helper.getTutorial('game-tutorial-finished'), {
      convertFuncToString: true,
    });
    let incomeText = `${income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₽`;
    if (penaltySum > 0)
      incomeText += ` (с учетом штрафа ${penaltySum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₽)`;
    tutorial[endGameStatus].text = tutorial[endGameStatus].text.replace('[[win-money]]', incomeText);
    this.set({ money: (this.money || 0) + income, helper: tutorial[endGameStatus], rankings });
    await this.saveChanges();
  }
});
