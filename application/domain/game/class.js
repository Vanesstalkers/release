(class Game extends domain.game['!hasPlane'](domain.game['!hasDeck'](domain.game['!GameObject'])) {
  #changes = {};
  #disableChanges = false;
  store = {};
  playerMap = {};
  bridgeMap = {};

  constructor(data = {}) {
    super(data, { col: 'game' });

    this.setGame(this);
    delete this.code; // мешается в ZoneSide.links + в принципе не нужен
  }
  change({ col, _id, key, value, fake }) {
    if (this.#disableChanges) return;
    if (!this.#changes[col]) this.#changes[col] = {};
    if (!this.#changes[col][_id]) this.#changes[col][_id] = { fake };
    this.#changes[col][_id][key] = value;
  }
  markNew(obj) {
    if (this.#disableChanges) return;
    const col = obj.col;
    const _id = obj._id;
    if (!this.#changes[col]) this.#changes[col] = {};
    this.#changes[col][_id] = obj;
  }
  getChanges() {
    return this.#changes;
  }
  enableChanges() {
    this.#disableChanges = false;
  }
  disableChanges() {
    this.#disableChanges = true;
  }
  clearChanges() {
    this.#changes = {};
  }

  async broadcastData() {
    const changes = this.getChanges();
    if (Object.keys(changes).length) {
      const $set = {};
      for (const [col, ids] of Object.entries(changes)) {
        if (col === 'game') {
          Object.assign($set, changes.game[this._id]);
        } else {
          for (const [id, value] of Object.entries(ids)) {
            if (value.fake) continue;
            for (const [key, val] of Object.entries(value)) {
              $set[`store.${col}.${id}.${key}`] = val;
            }
          }
        }
      }

      delete $set._id;
      await db.mongo.updateOne('game', { _id: db.mongo.ObjectID(this._id) }, { $set });

      lib.broadcaster.publish({ room: this, data: changes });
    }
  }
  prepareFakeData({ data, userId }) {
    const result = {};
    const player = this.getPlayerByUserId(userId);

    for (const [col, ids] of Object.entries(data)) {
      result[col] = {};
      for (const [id, changes] of Object.entries(ids)) {
        if (col === 'game' || col === 'player' || changes.fake) {
          result[col][id] = changes;
        } else {
          const obj = this.getObjectById(id);
          // объект может быть удален (!!! костыль)
          if (obj && typeof obj.prepareFakeData === 'function') {
            const { visibleId, preparedData } = obj.prepareFakeData({ data: changes, player });
            result[col][visibleId] = preparedData;
          } else result[col][id] = changes;
        }
      }
    }
    return result;
  }

  async fromJSON(data, { newGame } = {}) {
    if (data.store) this.store = data.store;
    this.addTime = data.addTime;
    this.settings = data.settings;
    this.status = data.status || 'waitForPlayers';
    this.round = data.round || 0;
    this.activeEvent = data.activeEvent; // в конструктор Game передается только _id
    this.eventHandlers = data.eventHandlers || {
      endRound: [],
      timerOverdue: [],
      replaceDice: [],
      addPlane: [],
      eventTrigger: [],
    };
    this.availablePorts = data.availablePorts;

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
    if (newGame === true) {
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
      for (const _id of planeIds) this.addPlane(this.store.plane[_id]);
    }

    if (data.bridgeMap) {
      data.bridgeList = [];
      for (const _id of Object.keys(data.bridgeMap)) data.bridgeList.push(this.store.bridge[_id]);
    }
    for (const item of data.bridgeList || []) this.addBridge(item);

    this.clearChanges();
    return this;
  }
  addPlayer(data) {
    const store = this.getStore();
    const player = new domain.game.Player(data, { parent: this });
    this.assign('playerMap', { [player._id]: {} });

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
  getPlayerList() {
    const store = this.getStore();
    return Object.keys(this.playerMap).map((_id) => store.player[_id]);
  }
  getPlayerByUserId(id) {
    return this.getPlayerList().find((player) => player.userId === id);
  }
  async userJoin({ userId }) {
    const player = this.getFreePlayerSlot();
    player.set('ready', true);
    player.set('userId', userId);
    if (!this.getFreePlayerSlot()) await this.updateStatus();
    return player;
  }
  getFreePlayerSlot() {
    return this.getPlayerList().find((player) => !player.ready);
  }
  getActivePlayer() {
    return this.getPlayerList().find((player) => player.active);
  }
  changeActivePlayer({ player } = {}) {
    const activePlayer = this.getActivePlayer();
    if (activePlayer.eventData.extraTurn) {
      activePlayer.delete('eventData', 'extraTurn');
      if (activePlayer.eventData.skipTurn) {
        // актуально только для событий в течение хода игрока, инициированных не им самим
        activePlayer.delete('eventData', 'skipTurn');
      } else {
        return activePlayer;
      }
    }

    const playerList = this.getPlayerList();
    let activePlayerIndex = playerList.findIndex((player) => player === activePlayer);
    let newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
    if (player) {
      if (player.eventData.skipTurn) player.delete('eventData', 'skipTurn');
      newActivePlayer = player;
    } else {
      while (newActivePlayer.eventData.skipTurn) {
        newActivePlayer.delete('eventData', 'skipTurn');
        activePlayerIndex++;
        newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
      }
    }

    activePlayer.set('active', false);
    newActivePlayer.set('active', true);

    return newActivePlayer;
  }
  linkPlanes({ joinPort, targetPort, fake }) {
    const { targetLinkPoint } = domain.game.linkPlanes({ joinPort, targetPort });

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
    joinPort.set('linkedBridge', bridgeCode);
    targetPort.set('linkedBridge', bridgeCode);
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
            this.linkPlanes({ joinPort: joinPort, targetPort: port, fake: true });
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
  isSinglePlayer() {
    return this.settings.singlePlayer;
  }

  addBridge(data) {
    const store = this.getStore();
    const bridge = new domain.game.Bridge(data, { parent: this });
    this.markNew(bridge);
    this.assign('bridgeMap', { [bridge._id]: {} });

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(store.zone[_id]);
    }
    for (const item of data.zoneList || []) {
      const zone = new domain.game.Zone(item, { parent: bridge });
      this.markNew(zone);
      bridge.assign('zoneMap', { [zone._id]: {} });
    }

    if (data.zoneLinks) {
      for (const [zoneCode, sideList] of Object.entries(data.zoneLinks)) {
        for (const [sideCode, links] of Object.entries(sideList)) {
          for (const link of links) {
            const [linkZoneCode, linkSideCode] = link.split('.');
            const zone = bridge.getObjectByCode(zoneCode);
            const side = zone.getObjectByCode(sideCode);
            const linkZone = bridge.getGame().getObjectByCode(linkZoneCode);
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
      for (const zone of this.getObjects({ className: 'Zone' })) {
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

  async smartMoveRandomCard({ target }) {
    const deck = this.getObjectByCode('Deck[card]');
    let card = deck.getRandomItem();
    if (card) card.moveToTarget(target);
    else {
      await this.restoreCardsFromDrop();
      card = deck.getRandomItem();
      if (card) card.moveToTarget(target);
    }
    return card;
  }
  async restoreCardsFromDrop() {
    const deck = this.getObjectByCode('Deck[card]');
    const deckDrop = this.getObjectByCode('Deck[card_drop]');
    for (const card of deckDrop.getObjects({ className: 'Card' })) {
      if (card.restoreAvailable()) card.moveToTarget(deck);
    }
    if (!this.isSinglePlayer()) return;
    const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
    const plane = gamePlaneDeck.getRandomItem();
    if (!plane) return;

    gamePlaneDeck.removeItem(plane);
    this.addPlane(plane);

    await domain.game.getPlanePortsAvailability(this, { joinPlaneId: plane._id });
    if (this.availablePorts) {
      // plane удаляется в getPlanePortsAvailability
      return; // все зоны стыковки заняты - новые блоки добавляться не будут
    }

    const availablePort = this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
    const { joinPortId, joinPortDirect, targetPortId, targetPortDirect } = availablePort;

    const joinPort = this.getObjectById(joinPortId);
    joinPort.updateDirect(joinPortDirect);
    const targetPort = this.getObjectById(targetPortId);
    targetPort.updateDirect(targetPortDirect);
    this.linkPlanes({ joinPort, targetPort });

    this.set('availablePorts', null);

    let availableZoneCount = 0;
    for (const plane of this.getObjects({ className: 'Plane', directParent: this })) {
      availableZoneCount += plane.getObjects({ className: 'Zone' }).filter((zone) => !zone.getNotDeletedItem()).length;
    }
    for (const bridge of this.getObjects({ className: 'Bridge', directParent: this })) {
      availableZoneCount += bridge.getObjects({ className: 'Zone' }).filter((zone) => !zone.getNotDeletedItem()).length;
    }
    const dominoCount =
      this.getObjectByCode('Deck[domino]').getObjects({ className: 'Dice' }).length +
      this.getActivePlayer().getObjects({ className: 'Dice' }).length;

    console.log('availableZoneCount=', availableZoneCount, dominoCount);
    if (availableZoneCount > dominoCount) {
      game.updateStatus();
      return { status: 'ok', gameFinished: true };
    }
  }

  addEventHandler({ handler, source }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    this.assign('eventHandlers', { [handler]: this.eventHandlers[handler].concat(source._id.toString()) });
  }
  deleteEventHandler({ handler, source }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    this.assign('eventHandlers', {
      [handler]: this.eventHandlers[handler].filter((_id) => _id !== source._id.toString()),
    });
  }
  async callEventHandlers({ handler, data }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    for (const sourceId of this.eventHandlers[handler]) {
      const source = this.getObjectById(sourceId);
      const { saveHandler, timerOverdueOff } = (await source.callHandler({ handler, data })) || {};
      if (!saveHandler) this.deleteEventHandler({ handler, source });
      if (timerOverdueOff) this.deleteEventHandler({ handler: 'timerOverdue', source });
    }
  }
  clearEventHandlers() {
    for (const handler of Object.keys(this.eventHandlers)) this.assign('eventHandlers', { [handler]: [] });
  }
  async updateStatus() {
    const playerList = this.getObjects({ className: 'Player' });
    switch (this.status) {
      case 'waitForPlayers':
        const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
        for (let i = 0; i < this.settings.planesAtStart; i++) {
          const plane = gamePlaneDeck.getRandomItem();
          if (plane) {
            gamePlaneDeck.removeItem(plane);
            this.addPlane(plane);
            if (i > 0) {
              await domain.game.getPlanePortsAvailability(this, { joinPlaneId: plane._id });
              const availablePort = this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
              const { joinPortId, joinPortDirect, targetPortId, targetPortDirect } = availablePort;

              const joinPort = this.getObjectById(joinPortId);
              joinPort.updateDirect(joinPortDirect);
              const targetPort = this.getObjectById(targetPortId);
              targetPort.updateDirect(targetPortDirect);
              this.linkPlanes({ joinPort, targetPort });

              this.set('availablePorts', null);
            }
          }
        }

        const planesPlacedByPlayerCount = this.settings.planesNeedToStart - this.settings.planesAtStart;
        for (let i = 0; i < planesPlacedByPlayerCount; i++) {
          const hand = playerList[i % playerList.length].getObjectByCode('Deck[plane]');
          for (let j = 0; j < 2; j++) {
            const plane = gamePlaneDeck.getRandomItem();
            plane.moveToTarget(hand);
          }
        }

        this.set('status', 'prepareStart');
        if (planesPlacedByPlayerCount > 0) {
          this.addEventHandler({ handler: 'addPlane', source: this });
          lib.timers.timerRestart(this);
        } else {
          await this.updateStatus();
        }
        break;
      case 'prepareStart':
        const deck = this.getObjectByCode('Deck[domino]');
        for (const player of playerList) {
          const playerHand = player.getObjectByCode('Deck[domino]');
          deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
          // const deckCard = this.getObjectByCode('Deck[card]');
          // const playerHandCard = player.getObjectByCode('Deck[card]');
          // deckCard.moveRandomItems({ count: 3, target: playerHandCard });
        }

        this.set('status', 'inProcess');
        await domain.game.endRound(this, { forceActivePlayer: playerList[0] });
        break;
      case 'inProcess':
        lib.timers.timerDelete(this);
        this.set('status', 'finished');
        break;
    }
  }

  async callHandler({ handler, data = {} }) {
    const player = this.getActivePlayer();
    switch (handler) {
      case 'addPlane':
        if (this.status === 'prepareStart') {
          const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
          const playerPlaneDeck = player.getObjectByCode('Deck[plane]');
          const planeList = playerPlaneDeck.getObjects({ className: 'Plane' });
          for (const plane of planeList) plane.moveToTarget(gamePlaneDeck);
          if (Object.keys(this.planeMap).length < this.settings.planesNeedToStart) {
            this.changeActivePlayer();
            lib.timers.timerRestart(this);
            return { saveHandler: true };
          } else {
            await this.updateStatus();
            return { timerOverdueOff: true };
          }
        }
        break;
    }
  }

  onTimerRestart({ timerId, data: { time = this.settings.timer, extraTime = 0 } = {} }) {
    const player = this.getActivePlayer();
    if (extraTime) {
      player.set('timerEndTime', player.timerEndTime + extraTime * 1000);
    } else {
      player.set('timerEndTime', Date.now() + time * 1000);
    }
    player.set('timerUpdateTime', Date.now());
  }
  async onTimerTick({ timerId, data: { time = null } = {} }) {
    const player = this.getActivePlayer();
    console.log('setInterval', player.timerEndTime - Date.now()); // временно оставил для отладки
    if (this.finished) return clearInterval(timerId);
    if (player.timerEndTime < Date.now()) {
      clearInterval(timerId);
      await api.game.action({
        name: 'endRound',
        data: { timerOverdue: true },
        customContext: { gameId: this._id, playerId: player._id },
      });
    }
  }
  onTimerDelete({ timerId }) {
    const player = this.getActivePlayer();
    player.set('timerEndTime', null);
    player.set('timerUpdateTime', Date.now());
  }
});
