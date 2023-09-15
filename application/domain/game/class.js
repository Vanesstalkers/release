(class Game extends lib.game.class() {
  constructor() {
    super();
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
      ...lib.game.decorators['@hasCardEvents'].decorate({
        additionalCardEvents: { replaceDice: [], addPlane: [] },
      }),
      ...domain.game.decorators['@hasPlane'].decorate(),
    });
    this.preventSaveFields(['availableZones']);

    // !!! подумать, как лучше это организовать
    this.events({
      handlers: {
        addPlane: function () {
          this.emitCardEvents('addPlane');
          this.checkStatus({ cause: 'PLAYFIELD_CREATING' });
        },
        noAvailablePorts: function ({ joinPlane }) {
          const planeParent = joinPlane.getParent();
          if (this.status === 'PREPARE_START') {
            planeParent.removeItem(joinPlane);
            if (Object.keys(this.planeMap).length === 0) {
              // размещается первый plane на пустое поле
              this.addPlane(joinPlane);
            } else {
              // все port заблокированы, размещать plane некуда
              this.set({ noAvailablePorts: true });
              this.checkStatus({ cause: 'PLAYFIELD_CREATING' });
            }
          } else {
            if (!joinPlane.customClass.includes('card-plane')) {
              const planeDeck = this.getObjectByCode('Deck[plane]');
              joinPlane.moveToTarget(planeDeck);
            } else {
              planeParent.removeItem(joinPlane);
            }
          }
        },
      },
    });
  }

  run(actionName, data) {
    const action = domain.game.actions[actionName];
    if (!action) throw new Error(`action "${actionName}" not found`);
    return action.call(this, data);
  }

  fillData(data, { newGame } = {}) {
    if (data.store) this.store = data.store;
    this.logs(data.logs);
    this.deckType = data.deckType;
    this.gameType = data.gameType;
    this.gameConfig = data.gameConfig;
    this.gameTimer = data.gameTimer;
    this.addTime = data.addTime;
    this.settings = data.settings;
    this.status = data.status || 'WAIT_FOR_PLAYERS';
    this.round = data.round || 0;
    if (data.activeEvent) this.activeEvent = data.activeEvent;
    if (data.cardEvents) this.cardEvents = data.cardEvents;
    this.availablePorts = data.availablePorts || [];

    if (data.playerMap) {
      data.playerList = [];
      for (const _id of Object.keys(data.playerMap)) data.playerList.push(this.store.player[_id]);
    } else {
      data.playerList = data.settings.playerList;
    }
    for (const item of data.playerList || []) this.run('addPlayer', item);

    if (data.deckMap) {
      data.deckList = [];
      for (const _id of Object.keys(data.deckMap)) data.deckList.push(this.store.deck[_id]);
    } else {
      data.deckList = data.settings.deckList;
    }
    for (const item of data.deckList || []) {
      const deckItemClass =
        item.type === 'domino'
          ? domain.game.objects.Dice
          : item.type === 'plane'
          ? domain.game.objects.Plane
          : lib.game.objects.Card;

      if (item.access === 'all') item.access = this.playerMap;
      this.addDeck(item, { deckItemClass });
    }
    if (newGame) {
      let { cards, dices, planes } = domain.game.configs;
      cards = cards.filter((card) => !this.settings.cardsToRemove.includes(card.name));

      for (const [deckCode, json] of [
        ['Deck[domino]', dices],
        ['Deck[card]', cards],
        ['Deck[plane]', planes],
      ]) {
        const deck = this.getObjectByCode(deckCode);
        const items = lib.utils.structuredClone(json);
        for (const item of items) deck.addItem(item);
      }
    }

    if (data.planeMap) {
      // восстановление игры из БД
      const planeIds = Object.keys(data.planeMap);
      for (const _id of planeIds) {
        this.addPlane(this.store.plane[_id], { preventEmitClassEvent: true });
      }
    }

    if (data.bridgeMap) {
      data.bridgeList = [];
      for (const _id of Object.keys(data.bridgeMap)) data.bridgeList.push(this.store.bridge[_id]);
    }
    for (const item of data.bridgeList || []) this.run('addBridge', item);

    this.clearChanges(); // игра запишется в БД в store.create
    return this;
  }

  checkCrutches() {
    let updatedMap = {};
    for (const diceSideId of Object.keys(this.crutchMap || {})) {
      const diceSide = this.getObjectById(diceSideId);
      const dice = diceSide.parent();
      const parentZone = dice.findParent({ className: 'Zone' });
      if (!parentZone) {
        updatedMap[diceSideId] = null;
        continue;
      }
      const parentZoneSide = parentZone.sideList.find(({ diceSideCode }) => diceSideCode === diceSide.code);

      let hasCrutch = false;
      if (parentZoneSide?.expectedValues) {
        for (const expectedValue of Object.keys(parentZoneSide.expectedValues)) {
          if (expectedValue.toString() !== diceSide.value.toString()) hasCrutch = true;
        }
      }
      if (hasCrutch === false) updatedMap[diceSideId] = null;
    }
    if (Object.keys(updatedMap).length) this.set({ crutchMap: updatedMap });
  }
  crutchCount() {
    return Object.keys(this.crutchMap || {}).length;
  }
  getFullPrice() {
    const planes = this.getObjects({ className: 'Plane', directParent: this });
    const baseSum = planes.reduce((sum, plane) => sum + plane.price, 0);
    const timerMod = 30 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  /**
   * Проверяет и обновляет статус игры, если это необходимо
   * @throws lib.game.endGameException
   */
  checkStatus({ cause } = {}) {
    const activePlayer = this.getActivePlayer();
    const playerList = this.getObjects({ className: 'Player' });
    switch (this.status) {
      case 'WAIT_FOR_PLAYERS':
        switch (cause) {
          case 'PLAYER_JOIN':
            if (this.getFreePlayerSlot()) return;

            const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
            const addPlaneConfig = { preventEmitClassEvent: true };
            const skipArray = [];
            for (let i = 0; i < this.settings.planesAtStart; i++) {
              const plane = gamePlaneDeck.getRandomItem({ skipArray });
              if (plane) {
                skipArray.push(plane.id());
                if (i === 0) {
                  // игровое поле пустое
                  gamePlaneDeck.removeItem(plane);
                  this.addPlane(plane, addPlaneConfig);
                } else {
                  this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
                  if (this.availablePorts.length === 0) continue;

                  const availablePortConfig =
                    this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
                  this.run('putPlaneOnField', availablePortConfig, { addPlaneConfig });
                }
              } else {
                i = this.settings.planesAtStart;
              }
            }

            const planesToBePlacedByPlayers = this.settings.planesNeedToStart - this.settings.planesAtStart;
            for (let i = 0; i < planesToBePlacedByPlayers; i++) {
              const hand = playerList[i % playerList.length].getObjectByCode('Deck[plane]');
              for (let j = 0; j < this.settings.planesToChoosee; j++) {
                const plane = gamePlaneDeck.getRandomItem();
                plane.moveToTarget(hand);
              }
            }

            this.set({ status: 'PREPARE_START' });
            if (planesToBePlacedByPlayers > 0) {
              lib.timers.timerRestart(this);
            } else {
              this.checkStatus({ cause: 'START_GAME' });
            }
            break;
        }
        break;

      case 'PREPARE_START':
        switch (cause) {
          case 'PLAYFIELD_CREATING':
            const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
            const playerPlaneDeck = activePlayer.getObjectByCode('Deck[plane]');
            const planeList = playerPlaneDeck.getObjects({ className: 'Plane' });
            for (const plane of planeList) plane.moveToTarget(gamePlaneDeck);
            const notEnoughPlanes = Object.keys(this.planeMap).length < this.settings.planesNeedToStart;
            if (notEnoughPlanes && this.noAvailablePorts !== true) {
              this.changeActivePlayer();
              lib.timers.timerRestart(this);
            } else {
              this.checkStatus({ cause: 'START_GAME' });
            }
            break;

          case 'START_GAME':
            this.set({ status: 'IN_PROCESS' });

            const deck = this.getObjectByCode('Deck[domino]');
            for (const player of playerList) {
              const playerHand = player.getObjectByCode('Deck[domino]');
              deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
            }

            this.run('endRound', { forceActivePlayer: playerList[0] });
            break;

          case 'PLAYER_TIMER_END':
            const planeDeck = activePlayer.getObjectByCode('Deck[plane]');
            const plane = planeDeck.getObjects({ className: 'Plane' })[0];
            if (plane) this.run('showPlanePortsAvailability', { joinPlaneId: plane._id });

            const availablePortConfig = this.availablePorts[0];
            if (availablePortConfig) this.run('putPlaneOnField', availablePortConfig);
            break;
        }
        break;

      case 'IN_PROCESS':
        switch (cause) {
          case 'PLAYER_TIMER_END':
            this.run('endRound', { timerOverdue: true });
            break;

          case 'FINAL_RELEASE':
            let finalRelease = true;
            const planeList = this.getObjects({ className: 'Plane', directParent: this });
            const bridgeList = this.getObjects({ className: 'Bridge', directParent: this });
            for (const releaseItem of [...planeList, ...bridgeList]) {
              if (!finalRelease) continue;
              if (!releaseItem.release) finalRelease = false;
            }
            if (finalRelease) this.endGame({ winningPlayer: activePlayer });
            break;

          case 'PLAYFIELD_CREATING':
            let availableZoneCount = 0;
            for (const plane of this.getObjects({ className: 'Plane', directParent: this })) {
              availableZoneCount += plane
                .getObjects({ className: 'Zone' })
                .filter((zone) => !zone.getNotDeletedItem()).length;
            }
            for (const bridge of this.getObjects({ className: 'Bridge', directParent: this })) {
              availableZoneCount += bridge
                .getObjects({ className: 'Zone' })
                .filter((zone) => !zone.getNotDeletedItem()).length;
            }
            const dominoCount =
              this.getObjectByCode('Deck[domino]').getObjects({ className: 'Dice' }).length +
              activePlayer.getObjects({ className: 'Dice' }).length;

            // !!! был баг с недостаточным количеством костяшек для закрытия всех зон - отлавливаю
            // console.log('availableZoneCount > dominoCount =', availableZoneCount > dominoCount, {
            //   availableZoneCount,
            //   dominoCount,
            // });
            if (availableZoneCount > dominoCount) this.endGame();
            break;
          default:
            this.endGame();
        }
        break;

      case 'FINISHED':
        switch (cause) {
          case 'PLAYER_TIMER_END':
            lib.timers.timerDelete(this);
            break;
        }
        break;
    }
  }
});
