(class Game extends lib.game.class() {
  constructor(data = {}) {
    super();
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...domain.game['@hasDeck'].decorate(),
      ...domain.game['@hasPlane'].decorate(),
    });
    this.preventSaveFields(['availableZones']);

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

  fromJSON(data, { newGame } = {}) {
    if (data.store) this.store = data.store;
    this.logs(data.logs);
    this.type = data.type;
    this.subtype = data.subtype;
    this.addTime = data.addTime;
    this.settings = data.settings;
    this.status = data.status || 'WAIT_FOR_PLAYERS';
    this.round = data.round || 0;
    if (data.activeEvent) this.activeEvent = data.activeEvent;
    this.cardEvents = data.cardEvents || {
      endRound: [],
      timerOverdue: [],
      replaceDice: [],
      addPlane: [],
      eventTrigger: [],
    };
    this.availablePorts = data.availablePorts || [];

    if (data.playerMap) {
      data.playerList = [];
      for (const _id of Object.keys(data.playerMap)) data.playerList.push(this.store.player[_id]);
    }
    for (const item of data.playerList || []) this.run('addPlayer', item);

    if (data.deckMap) {
      data.deckList = [];
      for (const _id of Object.keys(data.deckMap)) data.deckList.push(this.store.deck[_id]);
    }
    for (const item of data.deckList || []) {
      const deckItemClass =
        item.type === 'domino' ? domain.game.Dice : item.type === 'plane' ? domain.game.Plane : domain.game.Card;

      if (item.access === 'all') item.access = this.playerMap;
      this.addDeck(item, { deckItemClass });
    }
    if (newGame) {
      const cardsJSON = domain.game.cardsJSON.filter((card) => !this.settings.cardsToRemove.includes(card.name));

      for (const [deckCode, json] of [
        ['Deck[domino]', domain.game.dicesJSON],
        ['Deck[card]', cardsJSON],
        ['Deck[plane]', domain.game.planesJSON],
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

  addCardEvent({ event, source }) {
    if (!this.cardEvents[event]) this.set({ cardEvents: { [event]: [] } });
    this.set({
      cardEvents: {
        [event]: this.cardEvents[event].concat(source.id()),
      },
    });
  }
  deleteCardEvent({ event, source }) {
    if (!this.cardEvents[event]) throw new Error(`cardEvent not found (code=${this.code}, event=${event})`);
    this.set({
      cardEvents: {
        [event]: this.cardEvents[event].filter((id) => id !== source._id),
      },
    });
  }
  /**
   * События карт
   */
  emitCardEvents(event, data) {
    if (!this.cardEvents[event]) throw new Error(`cardEvent not found (code=${this.code}, event=${event})`);
    for (const sourceId of this.cardEvents[event]) {
      const source = this.getObjectById(sourceId);
      const { saveEvent, timerOverdueOff } = source.emit(event, data) || {};
      if (!saveEvent) this.deleteCardEvent({ event, source });
      if (timerOverdueOff) this.deleteCardEvent({ event: 'timerOverdue', source });
    }
  }
  clearCardEvents() {
    for (const event of Object.keys(this.cardEvents)) {
      this.set({ cardEvents: { [event]: [] } });
    }
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
    return this.getObjects({ className: 'Plane', directParent: this }).reduce((sum, plane) => sum + plane.price, 0);
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
            console.log('availableZoneCount > dominoCount =', availableZoneCount > dominoCount, {
              availableZoneCount,
              dominoCount,
            });
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

  onTimerRestart({ timerId, data: { time = this.settings.timer, extraTime = 0 } = {} }) {
    const player = this.getActivePlayer();
    if (extraTime) {
      player.set({ timerEndTime: (player.timerEndTime || 0) + extraTime * 1000 });
    } else {
      player.set({ timerEndTime: Date.now() + time * 1000 });
    }
    player.set({ timerUpdateTime: Date.now() });
    if (!player.timerEndTime) throw 'player.timerEndTime === NaN';
  }
  async onTimerTick({ timerId, data: { time = null } = {} }) {
    try {
      const player = this.getActivePlayer();
      if (!player.timerEndTime) {
        if (this.status === 'FINISHED') {
          // тут некорректное завершение таймера игры
          // остановка таймера должна была отработать в endGame
          // бросать endGameException нельзя, потому что в removeGame будет вызов saveChanges, который попытается сделать broadcastData, но channel к этому моменту будет уже удален
          lib.timers.timerDelete(this);
          return;
        } else throw 'player.timerEndTime === NaN';
      }
      console.log('setInterval', player.timerEndTime - Date.now()); // временно оставил для отладки (все еще появляются setInterval NaN - отловить не смог)
      if (player.timerEndTime < Date.now()) {
        this.checkStatus({ cause: 'PLAYER_TIMER_END' });
        await this.saveChanges();
      }
    } catch (exception) {
      if (exception instanceof lib.game.endGameException) {
        await this.removeGame();
      } else throw exception;
    }
  }
  onTimerDelete({ timerId }) {
    const player = this.getActivePlayer();
    player.set({
      timerEndTime: null,
      timerUpdateTime: Date.now(),
    });
  }
});
