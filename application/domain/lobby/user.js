(class LobbyUser extends lib.user.class() {
  async enterLobby({ sessionId, lobbyId }) {
    const {
      helper: { getTutorial },
      utils: { structuredClone: clone },
      store: {
        broadcaster: { publishAction },
      },
    } = lib;

    publishAction(`lobby-${lobbyId}`, 'userEnter', {
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

    const tutorialName = 'lobby-tutorial-start';
    if (!helper && !finishedTutorials[tutorialName]) {
      const tutorial = getTutorial(tutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      helper = clone(helper, { convertFuncToString: true });
      currentTutorial = { active: tutorialName };
    }
    helperLinks = {
      ...domain.lobby.tutorial.getHelperLinks(),
      ...helperLinks,
    };
    
    this.set({ currentTutorial, helper, helperLinks });
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
    const {
      helper: { getTutorial },
      utils: { structuredClone: clone },
    } = lib;

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
      const tutorial = getTutorial(gameStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      helper = clone(helper, { convertFuncToString: true });
      currentTutorial = { active: gameStartTutorialName };
    }
    helperLinks = {
      ...domain.game.tutorial.getHelperLinks(),
      ...helperLinks,
    };
    
    this.set({ currentTutorial, helper, helperLinks });
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
    const {
      helper: { getTutorial },
      utils: { structuredClone: clone },
    } = lib;

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

    const rankings = clone(this.rankings || {});
    if (!rankings[gameType]) rankings[gameType] = {};
    const { games = 0, win = 0, money = 0, crutch = 0, penalty = 0, totalTime = 0 } = rankings[gameType];

    let income = 0;
    let penaltySum = 0;
    if (endGameStatus === 'win') {
      penaltySum = 100 * crutchCount * 1000;
      income = fullPrice * 1000 - penaltySum;
      rankings[gameType].money = money + income;
      if (income < 0) income = 0; // в рейтинги отрицательный результата пишем
      rankings[gameType].penalty = penalty + penaltySum;
      rankings[gameType].crutch = crutch + crutchCount;
      rankings[gameType].win = win + 1;
    }
    rankings[gameType].games = games + 1;
    rankings[gameType].totalTime = totalTime + roundCount;
    rankings[gameType].avrTime = Math.floor(rankings[gameType].totalTime / rankings[gameType].win);

    const tutorial = clone(getTutorial('game-tutorial-finished'), {
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
