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
          menuTop: { selector: '.menu-item.top', tutorial: 'lobby-tutorial-links', type: 'lobby' },
          menuChat: { selector: '.menu-item.chat', tutorial: 'lobby-tutorial-links', type: 'lobby' },
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

    for (const session of this.sessions()) {
      session.unsubscribe(`game-${gameId}`);
      session.set({ gameId: null, playerId: null });
      await session.saveChanges();
      session.send('session/leaveGame', {});
    }
  }
});
