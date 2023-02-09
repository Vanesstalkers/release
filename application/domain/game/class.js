(class Game extends domain.game['!hasPlane'](
  domain.game['!hasDeck'](domain.game['!GameObject'])
) {
  #changes = {};
  store = {};
  playerMap = {};
  bridgeMap = {};

  constructor(data = {}) {
    super(data, { col: 'game' });

    this.setGame(this);
    delete this.code; // мешается в ZoneSide.links + в принципе не нужен
  }
  change({ col, _id, key, value }) {
    if (!this.#changes[col]) this.#changes[col] = {};
    if (!this.#changes[col][_id]) this.#changes[col][_id] = {};
    this.#changes[col][_id][key] = value;
  }
  markNew(obj){
    const col = obj.col;
    const _id = obj._id;
    if (!this.#changes[col]) this.#changes[col] = {};
    this.#changes[col][_id] = obj;
  }
  getChanges() {
    return this.#changes;
  }
  clearChanges() {
    this.#changes = {};
  }
  fromJSON(data) {
    if (data.store) this.store = data.store;
    this.addTime = data.addTime;
    this.settings = data.settings;
    this.round = data.round;
    this.activeEvent = data.activeEvent; // в конструктор Game передается только _id
    this.eventHandlers = data.eventHandlers || {
      endRound: [],
      replaceDice: [],
      eventTrigger: [],
    };

    if (data.playerMap) {
      data.playerList = [];
      for (const _id of Object.keys(data.playerMap)) {
        data.playerList.push(this.store.player[_id]);
      }
    }
    if (data.playerList?.length)
      data.playerList.forEach((item) => this.addPlayer(item));
    // !!! надо перевести на Deck (по аналогии с Player)
    // if (data.planeList?.length) data.planeList.forEach(item => this.addDeck(item, {
    //   deckListName: 'planeList', deckItemClass: Plane,
    // }));

    if (data.planeMap) {
      data.planeList = [];
      for (const _id of Object.keys(data.planeMap)) {
        data.planeList.push(this.store.plane[_id]);
      }
    }
    if (data.planeList?.length)
      data.planeList.forEach((item) => this.addPlane(item));

    if (data.deckMap) {
      data.deckList = [];
      for (const _id of Object.keys(data.deckMap)) {
        data.deckList.push(this.store.deck[_id]);
      }
    }
    if (data.deckList?.length)
      data.deckList.forEach((item) =>
        this.addDeck(item, {
          deckItemClass:
            item.type === 'domino' ? domain.game.Dice : domain.game.Card,
        })
      );

    if (data.bridgeMap) {
      data.bridgeList = [];
      for (const _id of Object.keys(data.bridgeMap)) {
        data.bridgeList.push(this.store.bridge[_id]);
      }
    }
    if (data.bridgeList?.length)
      data.bridgeList.forEach((item) => this.addBridge(item));

    this.clearChanges();
    return this;
  }
  addPlayer(data) {
    const player = new domain.game.Player(data, { parent: this });
    this.playerMap[player._id] = {};

    if (data.deckMap) {
      data.deckList = [];
      for (const _id of Object.keys(data.deckMap)) {
        data.deckList.push(this.getStore().deck[_id]);
      }
    }
    if (data.deckList?.length)
      data.deckList.forEach((item) =>
        player.addDeck(item, {
          deckItemClass:
            item.type === 'domino'
              ? domain.game.Dice
              : item.type === 'plane'
              ? domain.game.Plane
              : domain.game.Card,
        })
      );
  }
  getPlayerList() {
    return Object.keys(this.playerMap).map((_id) => this.getStore().player[_id]);
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
      delete activePlayer.eventData.extraTurn;
      if (activePlayer.eventData.skipTurn) {
        delete activePlayer.eventData.skipTurn;
      } else {
        return activePlayer;
      }
    }

    const playerList = this.getPlayerList();
    let activePlayerIndex = playerList.findIndex(
      (player) => player === activePlayer
    );
    let newActivePlayer =
      playerList[(activePlayerIndex + 1) % playerList.length];
    while (newActivePlayer.eventData.skipTurn) {
      delete newActivePlayer.eventData.skipTurn;
      activePlayerIndex++;
      newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
    }

    activePlayer.active = false;
    newActivePlayer.active = true;

    return newActivePlayer;
  }
  linkPlanes({ joinPort, targetPort, fake }) {
    const { targetLinkPoint } = domain.game.linkPlanes({
      joinPort,
      targetPort,
    });

    if (fake) return;

    const DIRECTIONS = joinPort.constructor.DIRECTIONS;
    const targetPortDirect = DIRECTIONS[targetPort.getDirect()];

    const joinPlane = joinPort.getParent();
    const targetPlane = targetPort.getParent();
    const joinPlaneZoneLink = [
      joinPlane.code + Object.values(joinPort.links)[0],
    ];
    const targetPlaneZoneLink = [
      targetPlane.code + Object.values(targetPort.links)[0],
    ];

    // !!! zoneLinks может быть несколько (links[...]) - пока что не актуально (нет таких Plane)

    const reverseLinks = targetPortDirect.bridge.reverse;
    const bridgeZoneLinks = {
      'Zone[1]': {
        [reverseLinks ? 'ZoneSide[2]' : 'ZoneSide[1]']: targetPlaneZoneLink,
        [reverseLinks ? 'ZoneSide[1]' : 'ZoneSide[2]']: joinPlaneZoneLink,
      },
    };
    const bridgeData = {
      _code: joinPlane.code + '-' + targetPlane.code,
      left: targetLinkPoint.left,
      top: targetLinkPoint.top,
      rotation: targetPlane.rotation,
      zoneLinks: bridgeZoneLinks,
      zoneList: [
        {
          _code: 1,
          left: 0,
          top: 0,
          itemType: 'any',
          vertical: targetPortDirect.bridge.vertical,
        },
      ],
    };

    const bridgeCode = this.addBridge(bridgeData);
    joinPort.set('linkedBridge', bridgeCode);
    targetPort.set('linkedBridge', bridgeCode);
  }
  checkPlaneCollysion(checkPlane) {
    const planePosition = checkPlane.getPosition();

    function checkCollysion(pos1, pos2) {
      return !(
        pos1.bottom < pos2.top ||
        pos1.top > pos2.bottom ||
        pos1.right < pos2.left ||
        pos1.left > pos2.right
      );
    }

    const collysionList = [];
    this.getObjects({ className: 'Plane', directParent: this }).forEach(
      (plane) => {
        if (plane !== checkPlane) {
          if (checkCollysion(planePosition, plane.getPosition())) {
            collysionList.push(plane.code);
          }
        }
      }
    );

    return { collysionList, planePosition };
  }
  getAvailablePortsToJoinPlane({ joinPort }) {
    const availablePorts = [];

    const joinPlane = joinPort.getParent();
    this.getObjects({ className: 'Plane', directParent: this }).forEach(
      (plane) => {
        if (plane === joinPlane) return;
        plane.getObjects({ className: 'Port' }).forEach((port) => {
          if (!port.linkedBridge) {
            Object.keys(port.direct).forEach((portDirect) => {
              port.updateDirect(portDirect);
              this.linkPlanes({
                joinPort: joinPort,
                targetPort: port,
                fake: true,
              });
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
            });
          }
        });
      }
    );
    return availablePorts;
  }

  addBridge(data) {
    const bridge = new domain.game.Bridge(data, { parent: this });
    this.markNew(bridge);
    this.set('bridgeMap', { ...this.bridgeMap, [bridge._id]: {} });

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) {
        data.zoneList.push(this.getStore().zone[_id]);
      }
    }
    if (data.zoneList?.length) {
      data.zoneList.forEach((item) => {
        const zone = new domain.game.Zone(item, { parent: bridge });
        this.markNew(zone);
        bridge.set('zoneMap', { ...bridge.zoneMap, [zone._id]: {} });
      });
    }
    if (data.zoneLinks) {
      Object.entries(data.zoneLinks).forEach(([zoneCode, sideList]) => {
        Object.entries(sideList).forEach(([sideCode, links]) => {
          links.forEach((link) => {
            const [linkZoneCode, linkSideCode] = link.split('.');
            const zone = bridge.getObjectByCode(zoneCode);
            const side = zone.getObjectByCode(sideCode);
            const linkZone = bridge.getGame().getObjectByCode(linkZoneCode);
            const linkSide = linkZone.getObjectByCode(linkSideCode);
            side.addLink(linkSide);
            linkSide.addLink(side);
          });
        });
      });
    }

    return bridge.code;
  }
  getZonesAvailability(dice) {
    const result = new Map();
    dice.getParent().removeItem(dice); // чтобы не мешать расчету для соседних зон (* ниже вернем состояние)
    this.getObjects({ className: 'Zone' }).forEach((zone) => {
      const isAvailableStatus = zone.checkIsAvailable(dice);
      result.set(zone, isAvailableStatus);
    });
    dice.getParent().addItem(dice); // * восстанавливаем состояние
    return result;
  }

  getDeletedDices() {
    let result = [];
    this.getObjects({ className: 'Zone' }).forEach((zone) => {
      result = result.concat(
        zone.getObjects({ className: 'Dice' }).filter((dice) => dice.deleted)
      );
    });
    return result;
  }

  addEventHandler({ handler, source }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    this.eventHandlers[handler].push(source._id.toString());
  }
  deleteEventHandler({ handler, source }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    this.eventHandlers[handler] = this.eventHandlers[handler].filter(
      (_id) => _id !== source._id.toString()
    );
  }
  callEventHandlers({ handler, data }) {
    if (!this.eventHandlers[handler]) throw new Error('eventHandler not found');
    for (const sourceId of this.eventHandlers[handler]) {
      const source = this.getObjectById(sourceId);
      const deleteHandler = source.callHandler({ handler, data });
      if (deleteHandler) this.deleteEventHandler({ handler, source });
    }
  }
  clearEventHandlers() {
    Object.keys(this.eventHandlers).forEach((handler) => {
      this.eventHandlers[handler] = [];
    });
  }
});
