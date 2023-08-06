(class Game extends lib.game.class() {
  // #logs = {};
  bridgeMap = {};

  constructor(data = {}) {
    super();
    Object.assign(this, {
      ...domain.game['@hasDeck'].decorate(),
      ...domain.game['@hasPlane'].decorate(),
    });

    this.game(this);
    delete this.code; // мешается в ZoneSide.links + в принципе не нужен
  }

  fromJSON(data, { newGame } = {}) {
    this.disableChanges(); // игра запишется в БД в store.create

    if (data.store) this.store = data.store;
    this.logs(data.logs);
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
    for (const item of data.playerList || []) this.addPlayer(item);

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
    for (const item of data.bridgeList || []) this.addBridge(item);

    this.enableChanges();
    return this;
  }
  addPlayer(data) {
    const store = this.getStore();
    const player = new domain.game.Player(data, { parent: this });
    this.set({ playerMap: { [player._id]: {} } });

    if (data.deckMap) {
      data.deckList = [];
      for (const _id of Object.keys(data.deckMap)) data.deckList.push(store.deck[_id]);
    }
    for (const item of data.deckList || []) {
      const deckItemClass =
        item.type === 'domino' ? domain.game.Dice : item.type === 'plane' ? domain.game.Plane : domain.game.Card;
      item.access = { [player._id]: {} };
      player.addDeck(item, { deckItemClass });
    }
  }
  createBridgeBetweenPlanes({ joinPort, targetPort, fake }) {
    const { targetLinkPoint } = domain.game.getLinkCoordinates({ joinPort, targetPort });

    if (fake) return;

    const DIRECTIONS = joinPort.constructor.DIRECTIONS;
    const targetPortDirect = DIRECTIONS[targetPort.getDirect()];

    const joinPlane = joinPort.getParent();
    const targetPlane = targetPort.getParent();
    // !!! zoneLinks может быть несколько (links[...]) - пока что не актуально (нет таких Plane)
    const [joinPlaneZoneCode] = Object.values(joinPort.links);
    const [targetPlaneZoneCode] = Object.values(targetPort.links);
    const reverseLinks = targetPortDirect.bridge.reverse;
    const bridgeZoneLinks = {};
    const bridgeToCardPlane = joinPlane.isCardPlane();
    if (bridgeToCardPlane) {
      // у card-plane отсутствует связанная zone
      bridgeZoneLinks[reverseLinks ? 'ZoneSide[2]' : 'ZoneSide[1]'] = [targetPlane.code + targetPlaneZoneCode];
    } else {
      bridgeZoneLinks[reverseLinks ? 'ZoneSide[2]' : 'ZoneSide[1]'] = [targetPlane.code + targetPlaneZoneCode];
      bridgeZoneLinks[reverseLinks ? 'ZoneSide[1]' : 'ZoneSide[2]'] = [joinPlane.code + joinPlaneZoneCode];
    }
    const bridgeData = {
      _code: joinPlane.code + '-' + targetPlane.code,
      left: targetLinkPoint.left,
      top: targetLinkPoint.top,
      rotation: targetPlane.rotation,
      zoneLinks: { 'Zone[1]': bridgeZoneLinks },
      zoneList: [
        {
          _code: 1,
          left: 0,
          top: 0,
          itemType: 'any',
          vertical: targetPortDirect.bridge.vertical,
        },
      ],
      bridgeToCardPlane,
    };

    const bridgeCode = this.addBridge(bridgeData);
    joinPort.set({ linkedBridge: bridgeCode });
    targetPort.set({ linkedBridge: bridgeCode });
  }
  checkPlaneCollysion(checkPlane) {
    const planePosition = checkPlane.getPosition();

    function checkCollysion(pos1, pos2) {
      return !(pos1.bottom < pos2.top || pos1.top > pos2.bottom || pos1.right < pos2.left || pos1.left > pos2.right);
    }

    const collysionList = [];
    for (const plane of this.getObjects({ className: 'Plane', directParent: this })) {
      if (plane !== checkPlane && checkCollysion(planePosition, plane.getPosition())) collysionList.push(plane.code);
    }

    return { collysionList, planePosition };
  }
  getAvailablePortsToJoinPlane({ joinPort }) {
    const availablePorts = [];

    const joinPlane = joinPort.getParent();
    for (const plane of this.getObjects({ className: 'Plane', directParent: this })) {
      if (plane === joinPlane) continue;
      for (const port of plane.getObjects({ className: 'Port' })) {
        if (!port.linkedBridge) {
          for (const portDirect of Object.keys(port.direct)) {
            port.updateDirect(portDirect);
            this.createBridgeBetweenPlanes({ joinPort: joinPort, targetPort: port, fake: true });
            const checkPlaneCollysion = this.checkPlaneCollysion(joinPlane);
            if (checkPlaneCollysion.collysionList.length === 0) {
              availablePorts.push({
                joinPortId: joinPort._id,
                joinPortDirect: joinPort.getDirect(),
                targetPortId: port._id,
                targetPortDirect: portDirect,
                position: checkPlaneCollysion.planePosition,
              });
            }
          }
        }
      }
    }
    return availablePorts;
  }
  addBridge(data) {
    const store = this.getStore();
    const bridge = new domain.game.Bridge(data, { parent: this });
    this.set({ bridgeMap: { [bridge._id]: {} } });

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(store.zone[_id]);
    }
    for (const item of data.zoneList || []) {
      const zone = new domain.game.Zone(item, { parent: bridge });
      bridge.set({ zoneMap: { [zone._id]: {} } });
    }

    if (data.zoneLinks) {
      for (const [zoneCode, sideList] of Object.entries(data.zoneLinks)) {
        for (const [sideCode, links] of Object.entries(sideList)) {
          for (const link of links) {
            const [linkZoneCode, linkSideCode] = link.split('.');
            const zone = bridge.getObjectByCode(zoneCode);
            const side = zone.getObjectByCode(sideCode);
            const linkZone = bridge.game().getObjectByCode(linkZoneCode);
            const linkSide = linkZone.getObjectByCode(linkSideCode);
            side.addLink(linkSide);
            linkSide.addLink(side);
            linkZone.updateValues();
          }
        }
      }
    }

    return bridge.code;
  }
  getZonesAvailability(dice) {
    const result = new Map();
    this.disableChanges();
    {
      dice.getParent().removeItem(dice); // чтобы не мешать расчету для соседних зон (* ниже вернем состояние)

      const zoneList = [];
      zoneList.push(
        ...this.getObjects({ className: 'Plane', directParent: this }).reduce((arr, plane) => {
          return arr.concat(plane.getObjects({ className: 'Zone' }));
        }, [])
      );
      zoneList.push(
        ...this.getObjects({ className: 'Bridge', directParent: this }).reduce((arr, bridge) => {
          return arr.concat(bridge.getObjects({ className: 'Zone' }));
        }, [])
      );

      for (const zone of zoneList) {
        const isAvailableStatus = zone.checkIsAvailable(dice);
        result.set(zone, isAvailableStatus);
      }
      dice.getParent().addItem(dice); // * восстанавливаем состояние
    }
    this.enableChanges();
    return result;
  }

  getDeletedDices() {
    const result = [];
    for (const zone of this.getObjects({ className: 'Zone' })) {
      result.push(...zone.getObjects({ className: 'Dice' }).filter((dice) => dice.deleted));
    }
    return result;
  }

  smartMoveRandomCard({ target }) {
    const deck = this.getObjectByCode('Deck[card]');
    let card = deck.getRandomItem();
    if (card) card.moveToTarget(target);
    else {
      this.restoreCardsFromDrop();
      card = deck.getRandomItem();
      if (card) card.moveToTarget(target);
    }
    return card;
  }
  restoreCardsFromDrop() {
    const deck = this.getObjectByCode('Deck[card]');
    const deckDrop = this.getObjectByCode('Deck[card_drop]');
    for (const card of deckDrop.getObjects({ className: 'Card' })) {
      if (card.restoreAvailable()) card.moveToTarget(deck);
    }
    if (!this.isSinglePlayer()) return;
    const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
    let plane,
      skipArray = [];
    while ((plane = gamePlaneDeck.getRandomItem({ skipArray }))) {
      if (plane === null) return; // если перебор закончился, то getRandomItem вернет null
      skipArray.push(plane._id.toString());

      domain.game.getPlanePortsAvailability(this, { joinPlaneId: plane._id });
      if (this.availablePorts.length === 0) continue;

      gamePlaneDeck.removeItem(plane);
      this.addPlane(plane);
      
      const { userId } = this.getActivePlayer();
      this.logs({
        msg: `По завершению месяца (закончилась колода карт событий) добавлен новый блок на игровое поле.`,
        userId,
      });

      const availablePort = this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
      const { joinPortId, joinPortDirect, targetPortId, targetPortDirect } = availablePort;

      const joinPort = this.getObjectById(joinPortId);
      joinPort.updateDirect(joinPortDirect);
      const targetPort = this.getObjectById(targetPortId);
      targetPort.updateDirect(targetPortDirect);
      this.createBridgeBetweenPlanes({ joinPort, targetPort });

      this.set({ availablePorts: [] });
      return;
    }
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
            for (let i = 0; i < this.settings.planesAtStart; i++) {
              const plane = gamePlaneDeck.getRandomItem();
              if (plane) {
                gamePlaneDeck.removeItem(plane);
                this.addPlane(plane, { preventEmitClassEvent: true });
                if (i > 0) {
                  domain.game.getPlanePortsAvailability(this, { joinPlaneId: plane._id });
                  const availablePort = this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
                  const { joinPortId, joinPortDirect, targetPortId, targetPortDirect } = availablePort;

                  const joinPort = this.getObjectById(joinPortId);
                  joinPort.updateDirect(joinPortDirect);
                  const targetPort = this.getObjectById(targetPortId);
                  targetPort.updateDirect(targetPortDirect);
                  this.createBridgeBetweenPlanes({ joinPort, targetPort });

                  this.set({ availablePorts: [] });
                }
              }
            }

            const planesPlacedByPlayerCount = this.settings.planesNeedToStart - this.settings.planesAtStart;
            for (let i = 0; i < planesPlacedByPlayerCount; i++) {
              const hand = playerList[i % playerList.length].getObjectByCode('Deck[plane]');
              for (let j = 0; j < this.settings.planesToChoosee; j++) {
                const plane = gamePlaneDeck.getRandomItem();
                plane.moveToTarget(hand);
              }
            }

            this.set({ status: 'PREPARE_START' });
            if (planesPlacedByPlayerCount > 0) {
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
            if (Object.keys(this.planeMap).length < this.settings.planesNeedToStart && this.noAvailablePorts !== true) {
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

            domain.game.endRound(this, { forceActivePlayer: playerList[0] });
            break;

          case 'PLAYER_TIMER_END':
            const planeDeck = activePlayer.getObjectByCode('Deck[plane]');
            const plane = planeDeck.getObjects({ className: 'Plane' })[0];
            if (plane) domain.game.getPlanePortsAvailability(this, { joinPlaneId: plane._id });

            const availablePort = this.availablePorts[0];
            if (availablePort) domain.game.linkPlaneToField(this, { ...availablePort });
            break;
        }
        break;

      case 'IN_PROCESS':
        switch (cause) {
          case 'PLAYER_TIMER_END':
            domain.game.endRound(this, { timerOverdue: true });
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
  }
  async onTimerTick({ timerId, data: { time = null } = {} }) {
    try {
      const player = this.getActivePlayer();
      console.log('setInterval', player.timerEndTime - Date.now()); // временно оставил для отладки (все еще появляются setInterval NaN - отловить не смог)
      if (player.timerEndTime < Date.now()) {
        this.checkStatus({ cause: 'PLAYER_TIMER_END' });
        await this.saveChanges();
      }
    } catch (exception) {
      if (exception instanceof lib.game.endGameException) {
        await this.saveChanges();
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
