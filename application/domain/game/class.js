(class Game extends domain.game['!hasPlane'](domain.game['!hasDeck'](domain.game['!GameObject'])) {
  broadcastUserList = {};
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

  prepareBroadcastData(userId, data) {
    const result = {};
    const { playerId } = this.broadcastUserList[userId] || {};
    const player = playerId ? this.getObjectById(playerId) : null;

    for (const [col, ids] of Object.entries(data)) {
      result[col] = {};
      for (const [id, changes] of Object.entries(ids)) {
        if (col === 'game' || col === 'player' || changes.fake) {
          result[col][id] = changes;
        } else {
          const obj = this.getObjectById(id);
          // объект может быть удален (!!! костыль)
          if (obj && typeof obj.prepareDataForPlayer === 'function') {
            const { visibleId, preparedData } = obj.prepareDataForPlayer({ data: changes, player });
            result[col][visibleId] = preparedData;
          } else result[col][id] = changes;
        }
      }
    }
    return result;
  }

  fromJSON(data) {
    if (data.broadcastUserList) this.broadcastUserList = data.broadcastUserList;
    if (data.store) this.store = data.store;
    this.addTime = data.addTime;
    this.settings = data.settings;
    this.round = data.round;
    this.activeEvent = data.activeEvent; // в конструктор Game передается только _id
    this.eventHandlers = data.eventHandlers || {
      endRound: [],
      replaceDice: [],
      addPlane: [],
      eventTrigger: [],
    };

    if (data.playerMap) {
      data.playerList = [];
      for (const _id of Object.keys(data.playerMap)) data.playerList.push(this.store.player[_id]);
    }
    for (const item of data.playerList || []) this.addPlayer(item);
    // !!! надо перевести на Deck (по аналогии с Player)
    // if (data.planeList?.length) data.planeList.forEach(item => this.addDeck(item, {
    //   deckListName: 'planeList', deckItemClass: Plane,
    // }));

    if (data.planeMap) {
      data.planeList = [];
      for (const _id of Object.keys(data.planeMap)) data.planeList.push(this.store.plane[_id]);
    }
    for (const item of data.planeList || []) this.addPlane(item);

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
  getFreePlayerSlot() {
    return this.getPlayerList().find((player) => !player.ready);
  }
  getActivePlayer() {
    return this.getPlayerList().find((player) => player.active);
  }
  changeActivePlayer() {
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
    while (newActivePlayer.eventData.skipTurn) {
      newActivePlayer.delete('eventData', 'skipTurn');
      activePlayerIndex++;
      newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
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
  callEventHandlers({ handler, data }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    for (const sourceId of this.eventHandlers[handler]) {
      const source = this.getObjectById(sourceId);
      const { saveHandler } = source.callHandler({ handler, data }) || {};
      if (!saveHandler) this.deleteEventHandler({ handler, source });
    }
  }
  clearEventHandlers() {
    for (const handler of Object.keys(this.eventHandlers)) this.assign('eventHandlers', { [handler]: [] });
  }
});
