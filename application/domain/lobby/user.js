(class LobbyUser extends lib.user.class() {
  async enterLobby({ sessionId }) {
    lib.store.broadcaster.publishAction(`lobby-main`, 'userEnter', {
      sessionId,
      userId: this.id(),
      name: this.name,
    });

    let { helper = null, helperLinks = {}, finishedTutorials = {} } = this;
    const lobbyStartTutorialName = 'lobby-tutorial-start';
    if (!helper && !finishedTutorials[lobbyStartTutorialName]) {
      const tutorial = lib.helper.getTutorial(lobbyStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      // helperLinks = {
      //   'menu-top': { selector: '.menu-item.top', tutorial: lobbyStartTutorialName, type: 'lobby' },
      //   'menu-chat': { selector: '.menu-item.chat', tutorial: 'lobby-tutorial-menu', type: 'lobby' },
      // };
      this.set({ currentTutorial: { active: lobbyStartTutorialName } });
      this.set({ helper });
      this.set({ helperLinks });
    }

    await this.saveChanges();
  }
  leaveLobby({ sessionId }) {
    const lobbyName = `lobby-main`;
    lib.store.broadcaster.publishAction(lobbyName, 'userLeave', {
      sessionId,
      userId: this.id(),
    });
  }

  async joinGame({ gameId, playerId, isSinglePlayer }) {
    for (const session of this.sessions()) {
      session.set({ gameId, playerId });
      await session.saveChanges();
      session.send('session/joinGame', { gameId, playerId });
    }

    this.set({ gameId, playerId });

    let { helper = null, helperLinks = {}, finishedTutorials = {} } = this;
    const gameStartTutorialName = isSinglePlayer ? 'game-tutorial-start' : 'game-tutorial-startSingle';

    if (!helper && !finishedTutorials[gameStartTutorialName]) {
      const tutorial = lib.helper.getTutorial(gameStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      this.set({ currentTutorial: { active: gameStartTutorialName } });
      this.set({ helper });
    }
    if (Object.keys(helperLinks).length === 0) {
      helperLinks = {
        planeControls: {
          selector: '.gameplane-controls',
          tutorial: 'game-tutorial-links',
          type: 'game',
          pos: { top: false, left: false },
        },
        handPlanes: {
          selector: '.hand-planes',
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
      };
      this.set({ helperLinks });
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
