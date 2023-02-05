() => {
  class GameObject {
    _id;
    #game;
    #parent;
    #parentList;
    #_objects = {};
    #fakeParent = null;

    constructor(data, { parent } = {}) {
      if (!this._id) this._id = data._id || db.mongo.ObjectID();
      this.activeEvent = data.activeEvent;
      this.eventData = data.eventData || {};

      this.setParent(parent);
      this.addToParentsObjectStorage();
      if (parent) {
        const game = parent.getGame();
        this.setGame(game);
      }

      const customObjectCode = Object.getPrototypeOf(this).customObjectCode;
      if (data.code) {
        this.code = data.code;
      } else if (typeof customObjectCode === 'function') {
        const replacementFragment = '$$_code_$$';
        const codeTemplate = this.getCodeTemplate(
          this.constructor.name + '[' + replacementFragment + ']'
        );
        this.code = customObjectCode.call(
          this,
          { codeTemplate, replacementFragment },
          data
        );
      } else {
        this.code = this.getCodeTemplate(
          this.constructor.name + '[' + (data._code || '') + ']'
        );
      }
    }
    default_customObjectCode({ codeTemplate, replacementFragment }, data) {
      return codeTemplate.replace(replacementFragment, data._code);
    }
    addToParentsObjectStorage() {
      let parent = this.getParent();
      if (parent) {
        do {
          parent.addToObjectStorage(this);
        } while ((parent = parent.getParent()));
      }
    }
    addToObjectStorage(obj) {
      this.#_objects[obj._id] = obj;
    }
    deleteFromParentsObjectStorage() {
      let parent = this.getParent();
      do {
        parent.deleteFromObjectStorage(this);
      } while ((parent = parent.getParent()));
    }
    deleteFromObjectStorage(obj) {
      if (this.#_objects[obj._id]) delete this.#_objects[obj._id];
    }
    getObjectById(_id) {
      // _id всегда уникален
      return this.#_objects[_id];
    }
    getObjectByCode(code) {
      // внутри одного родителя code может быть не уникален
      return Object.values(this.#_objects).find((obj) => {
        obj.setFakeParent(this);
        const result = obj.code === obj.getCodeTemplate(code);
        obj.setFakeParent(null);
        return result;
      });
    }
    getCodePrefix() {
      return this.getParent()?.code || '';
    }
    getCodeSuffix() {
      return '';
    }
    getCodeTemplate(_code) {
      return '' + this.getCodePrefix() + _code + this.getCodeSuffix();
    }
    getObjects({ className, directParent } = {}) {
      let result = Object.values(this.#_objects);
      if (className)
        result = result.filter((obj) => obj.constructor.name === className);
      if (directParent)
        result = result.filter((obj) => obj.getParent() === directParent);
      return result;
    }
    setParent(parent) {
      if (parent) {
        this.#parent = parent;
        this.#parentList = [parent].concat(parent.getParentList() || []); // самый дальний родитель в конце массива
      }
    }
    setFakeParent(parent) {
      this.#fakeParent = parent;
    }
    updateParent(newParent) {
      this.getParent().deleteFromObjectStorage(this);
      this.setParent(newParent);
      newParent.addToObjectStorage(this);
    }
    getParent() {
      return this.#fakeParent || this.#parent;
    }
    getParentList() {
      return this.#parentList;
    }
    findParent({ className } = {}) {
      return this.#parentList.find((parent) => {
        if (className && parent.constructor.name !== className) return false;
        return true;
      });
    }
    getAllLinks() {
      return {
        parent: this.getParent(),
        parentList: this.getParentList(),
        objects: this.getObjects(),
      };
    }
    getGame() {
      return this.#game;
    }
    setGame(game) {
      this.#game = game;
    }
  }

  const hasDeck = (Base) =>
    class extends Base {
      addDeck(
        data,
        {
          deckClass = Deck,
          deckListName = 'deckList',
          deckItemClass = Dice,
        } = {}
      ) {
        if (!this[deckListName]) this[deckListName] = [];
        if (!data.settings) data.settings = {};
        data.settings.parentDeckContainer = deckListName;
        const deck = new deckClass(data, { parent: this });
        this[deckListName].push(deck);

        deck.setItemClass(deckItemClass);

        if (data.itemList?.length) {
          data.itemList.forEach((item) => deck.addItem(item));
        }

        return deck;
      }
      deleteDeck(deckToDelete) {
        deckToDelete.deleteFromParentsObjectStorage();
        const parentDeckContainer = deckToDelete.settings.parentDeckContainer;
        this[parentDeckContainer] = this[parentDeckContainer].filter(
          (deck) => deck != deckToDelete
        );
      }
    };
  const hasPlane = (Base) =>
    class extends Base {
      planeList = [];

      addPlane(data) {
        const plane = new Plane(data, { parent: this });
        this.planeList.push(plane);

        return plane;
      }
    };

  class Dice extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      this.deleted = data.deleted;

      if (data.sideList) {
        this.sideList = [
          new DiceSide(data.sideList[0], { parent: this }),
          new DiceSide(data.sideList[1], { parent: this }),
        ];
      } else {
        this.sideList = [
          new DiceSide({ _code: 1, value: data[0] }, { parent: this }),
          new DiceSide({ _code: 2, value: data[1] }, { parent: this }),
        ];
        if (Math.random() > 0.5) this.sideList.reverse(); // code останется в первичном виде
      }
    }
    customObjectCode({ codeTemplate, replacementFragment }, data) {
      return codeTemplate.replace(replacementFragment, '' + data[0] + data[1]);
    }

    moveToTarget(target) {
      const currentParent = this.getParent();
      currentParent.removeItem(this); // сначала удаляем, чтобы не помешать размещению на соседней зоне
      const moveResult = target.addItem(this);
      if (moveResult) {
        this.updateParent(target);
      } else {
        currentParent.addItem(this);
      }
      return moveResult;
    }
  }
  class DiceSide extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      this.value = data.value;
    }
  }

  class Card extends GameObject {
    #events;

    constructor(data, { parent }) {
      super(data, { parent });

      this.name = data.name;
      this.#events = domain.cardEvent[this.name];
    }
    moveToTarget(target) {
      const currentParent = this.getParent();
      currentParent.removeItem(this); // сначала удаляем
      const moveResult = target.addItem(this);
      if (moveResult) {
        this.updateParent(target);
      } else {
        currentParent.addItem(this);
      }
      return moveResult;
    }
    getSelfConfig() {
      return {
        handlers: Object.keys(this.#events.handlers),
      };
    }
    needAutoPlay() {
      return this.#events?.config?.autoPlay;
    }
    play() {
      const config = this.getSelfConfig();
      (config.handlers || []).forEach((handler) =>
        this.getGame().addEventHandler({ handler, source: this })
      );
      if (this.#events.init) this.#events.init.call(this);
    }
    callHandler({ handler, data }) {
      if (!this.#events.handlers[handler])
        throw new Error('eventHandler not found');
      return this.#events.handlers[handler].call(this, data);
    }
  }

  class Deck extends GameObject {
    itemList = [];
    #itemClass;

    constructor(data, { parent }) {
      super(data, { parent });

      this.type = data.type;
      this.subtype = data.subtype;
      this.itemType = data.itemType;
      this.settings = data.settings;
    }
    customObjectCode({ codeTemplate, replacementFragment }, data) {
      const replaceString = [data.type, data.subtype]
        .filter((item) => item)
        .join('_');
      return codeTemplate.replace(replacementFragment, replaceString);
    }

    setItemClass(itemClass) {
      this.#itemClass = itemClass;
    }
    getItemClass() {
      return this.#itemClass;
    }
    addItem(item) {
      const itemClass = this.getItemClass();
      if (item.constructor != itemClass)
        item = new itemClass(item, { parent: this });
      this.itemList.push(item);
      return true;
    }
    removeItem(itemToRemove) {
      this.itemList = this.itemList.filter((item) => item != itemToRemove);
    }
    getRandomItem() {
      return this.itemList[Math.floor(Math.random() * this.itemList.length)];
    }
  }

  class Zone extends GameObject {
    itemList = [];

    constructor(data, { parent }) {
      super(data, { parent });

      this.left = data.left || 0;
      this.top = data.top || 0;
      this.vertical = data.vertical;

      if (data.sideList) {
        this.sideList = [
          new ZoneSide(data.sideList[0], { parent: this }),
          new ZoneSide(data.sideList[1], { parent: this }),
        ];
      } else {
        this.sideList = [
          new ZoneSide({ _code: 1, value: data[0] }, { parent: this }),
          new ZoneSide({ _code: 2, value: data[1] }, { parent: this }),
        ];
      }

      if (data.itemList?.length) {
        data.itemList.forEach((item) => {
          const itemClass = this.getItemClass();
          if (item.constructor != itemClass)
            item = new itemClass(item, { parent: this });
          this.itemList.push(item);
        });
      }
    }
    customObjectCode() {
      return this.default_customObjectCode(...arguments);
    } // иначе подставится метод из Deck

    getItemClass() {
      return Dice;
    }
    addItem(item) {
      const itemClass = this.getItemClass();
      if (item.constructor != itemClass)
        item = new itemClass(item, { parent: this });

      const available = this.checkIsAvailable(item);
      if (available) {
        if (available === 'rotate') item.sideList.reverse();
        this.itemList.push(item);
        this.updateValues();
      }

      return available;
    }
    updateValues() {
      const item = this.getNotDeletedItem();
      this.sideList.forEach((side, sideIndex) => {
        if (item) {
          const itemSide = item.sideList[sideIndex];
          side.value = itemSide.value;
        } else {
          side.value = undefined;
        }
        for (const linkCode of Object.values(side.links)) {
          this.getGame().getObjectByCode(linkCode).updateExpectedValues();
        }
      });
    }
    removeItem(itemToRemove) {
      this.itemList = this.itemList.filter((item) => item != itemToRemove);
      this.updateValues();
    }
    getNotDeletedItem() {
      return this.itemList.find((item) => !item.deleted);
    }
    checkIsAvailable(dice, { skipPlacedItem } = {}) {
      if (!skipPlacedItem && this.getNotDeletedItem()) return false; // zone уже занята

      if (this.findParent({ className: 'Player' }) !== undefined) return false; // это plane в руке player

      const expectedValues0 = this.sideList[0].expectedValues;
      const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
      const expectedValues1 = this.sideList[1].expectedValues;
      const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

      if (
        this.findParent({ className: 'Bridge' }) !== undefined &&
        (!sizeOfExpectedValues0 || !sizeOfExpectedValues1)
      )
        return false; // для bridge-zone должны быть заполнены соседние zone

      if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return true; // соседние zone свободны

      if (
        (!sizeOfExpectedValues0 ||
          (expectedValues0[dice.sideList[0].value] &&
            sizeOfExpectedValues0 === 1)) &&
        (!sizeOfExpectedValues1 ||
          (expectedValues1[dice.sideList[1].value] &&
            sizeOfExpectedValues1 === 1))
      )
        return true;
      if (
        (!sizeOfExpectedValues0 ||
          (expectedValues0[dice.sideList[1].value] &&
            sizeOfExpectedValues0 === 1)) &&
        (!sizeOfExpectedValues1 ||
          (expectedValues1[dice.sideList[0].value] &&
            sizeOfExpectedValues1 === 1))
      )
        return 'rotate';

      return false;
    }
    checkItemCanBeRotated() {
      const expectedValues0 = this.sideList[0].expectedValues;
      const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
      const expectedValues1 = this.sideList[1].expectedValues;
      const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

      if (this.getParent().constructor.name === 'Bridge') return false;
      if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return true;
      return false;
    }
    checkForRelease() {
      const parent = this.getParent();
      if (parent.release) return false;
      if (
        parent
          .getObjects({ className: 'Zone' })
          .find((zone) => !zone.getNotDeletedItem())
      )
        return false;
      parent.release = true;
      return true;
    }
  }
  class ZoneSide extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      this.value = data.value || undefined;
      this.links = data.links || {};
      this.expectedValues = data.expectedValues || {};
    }

    addLink(link) {
      this.links[link._id] = link.code;
    }
    updateExpectedValues() {
      this.expectedValues = {};
      for (const linkCode of Object.values(this.links)) {
        const link = this.getGame().getObjectByCode(linkCode);
        if (link.value !== undefined) this.expectedValues[link.value] = true;
      }
    }
  }

  class Port extends GameObject {
    static DIRECTIONS = {
      top: {
        oppositeDirection: 'bottom',
        nextDirection: 'right',
        bridge: { vertical: true, reverse: true },
      },
      right: {
        oppositeDirection: 'left',
        nextDirection: 'bottom',
        bridge: {},
      },
      bottom: {
        oppositeDirection: 'top',
        nextDirection: 'left',
        bridge: { vertical: true },
      },
      left: {
        oppositeDirection: 'right',
        nextDirection: 'top',
        bridge: { reverse: true },
      },
    };

    width = 73;
    height = 73;

    constructor(data, { parent }) {
      super(data, { parent });

      this.left = data.left;
      this.top = data.top;
      this.direct = data.direct;
      this.links = data.links || {};
      this.linkedBridge = data.linkedBridge;
    }

    getDirect() {
      return Object.entries(this.direct).find(([direct, value]) => value)[0];
    }
    updateDirect(newDirect) {
      const directKeys = Object.keys(this.direct);

      if (newDirect) {
        if (this.direct[newDirect] !== undefined) {
          for (const direct of directKeys) this.direct[direct] = false;
          this.direct[newDirect] = true;

          return true;
        } else {
          return false;
        }
      } else {
        let usedDirectionIndex = 0;
        for (let i = 0; i < directKeys.length; i++) {
          if (this.direct[directKeys[i]]) usedDirectionIndex = i;
          this.direct[directKeys[i]] = false;
        }
        const newDirectionIndex = (usedDirectionIndex + 1) % directKeys.length;
        this.direct[directKeys[newDirectionIndex]] = true;

        return directKeys[newDirectionIndex];
      }
    }
  }

  class Bridge extends GameObject {
    zoneList = [];
    width = 0;
    height = 0;

    constructor(data, { parent }) {
      super(data, { parent });

      this.left = data.left;
      this.top = data.top;
      this.rotation = data.rotation || 0;
    }
  }

  class Plane extends GameObject {
    zoneList = [];
    portList = [];
    width = 500;
    height = 250;

    constructor(data, { parent }) {
      super(data, { parent });

      this.release = data.release || false;
      this.left = data.left || 0;
      this.top = data.top || 0;
      this.rotation = data.rotation || 0;
      if (data.width) this.width = data.width;
      if (data.height) this.height = data.height;

      if (data.zoneList?.length) {
        data.zoneList.forEach((item) => {
          this.zoneList.push(new Zone(item, { parent: this }));
        });
      }
      if (data.zoneLinks) {
        Object.entries(data.zoneLinks).forEach(([zoneCode, sideList]) => {
          Object.entries(sideList).forEach(([sideCode, links]) => {
            links.forEach((link) => {
              const [linkZoneCode, linkSideCode] = link.split('.');
              const zone = this.getObjectByCode(zoneCode);
              const side = zone.getObjectByCode(sideCode);
              const linkZone = this.getObjectByCode(linkZoneCode);
              const linkSide = linkZone.getObjectByCode(linkSideCode);
              side.addLink(linkSide);
              linkSide.addLink(side);
            });
          });
        });
      }

      if (data.portList?.length) {
        for (const port of data.portList) {
          const filledLinks = {};
          for (const linkCode of Object.values(port.links)) {
            const [linkZoneCode, linkSideCode] = linkCode.split('.');
            const linkZone = this.getObjectByCode(linkZoneCode);
            const linkSide = linkZone.getObjectByCode(linkSideCode);
            filledLinks[linkSide._id] = linkCode;
          }
          this.addPort({ ...port, links: filledLinks });
        }
      }
    }

    getCodePrefix(){
      return '';
    }

    addPort(data) {
      const port = new Port(data, { parent: this });
      this.portList.push(port);
    }
    getZone({ code }) {
      return this.zoneList.find((zone) => zone.code === code);
    }
    getCurrentRotation() {
      return this.rotation;
    }
    getPosition() {
      switch (this.getCurrentRotation()) {
        case 0:
          return {
            left: this.left,
            right: this.left + this.width,
            top: this.top,
            bottom: this.top + this.height,
          };
        case 1:
          return {
            left: this.left - this.height,
            right: this.left,
            top: this.top,
            bottom: this.top + this.width,
          };
        case 2:
          return {
            left: this.left - this.width,
            right: this.left,
            top: this.top - this.height,
            bottom: this.top,
          };
        case 3:
          return {
            left: this.left,
            right: this.left + this.height,
            top: this.top - this.width,
            bottom: this.top,
          };
      }
    }
  }

  class Player extends hasPlane(hasDeck(GameObject)) {
    constructor(data, { parent }) {
      super(data, { parent });

      this.active = data.active;
    }
  }

  return class Game extends hasPlane(hasDeck(GameObject)) {
    playerList = [];
    bridgeList = [];

    constructor(data = {}) {
      super(data);

      this.setGame(this);
      delete this.code; // мешается в ZoneSide.links + в принципе не нужен
    }

    fromJSON(data) {
      this.addTime = data.addTime;
      this.settings = data.settings;
      this.round = data.round;
      this.activeEvent = data.activeEvent; // в конструктор Game передается только _id
      this.eventHandlers = data.eventHandlers || {
        endRound: [],
        replaceDice: [],
        eventTrigger: [],
      };

      if (data.playerList?.length)
        data.playerList.forEach((item) => this.addPlayer(item));
      // !!! надо перевести на Deck (по аналогии с Player)
      // if (data.planeList?.length) data.planeList.forEach(item => this.addDeck(item, {
      //   deckListName: 'planeList', deckItemClass: Plane,
      // }));
      if (data.planeList?.length)
        data.planeList.forEach((item) => this.addPlane(item));
      if (data.deckList?.length)
        data.deckList.forEach((item) =>
          this.addDeck(item, {
            deckItemClass: item.type === 'domino' ? Dice : Card,
          })
        );
      if (data.bridgeList?.length)
        data.bridgeList.forEach((item) => this.addBridge(item));

      return this;
    }
    addPlayer(data) {
      const player = new Player(data, { parent: this });
      this.playerList.push(player);

      if (data.deckList?.length)
        data.deckList.forEach((item) =>
          player.addDeck(item, {
            deckItemClass:
              item.type === 'domino'
                ? Dice
                : item.type === 'plane'
                ? Plane
                : Card,
          })
        );
    }
    getFreePlayerSlot() {
      return this.playerList.find((player) => !player.ready);
    }
    getActivePlayer() {
      return this.playerList.find((player) => player.active);
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

      let activePlayerIndex = this.playerList.findIndex(
        (player) => player === activePlayer
      );
      let newActivePlayer =
        this.playerList[(activePlayerIndex + 1) % this.playerList.length];
      while (newActivePlayer.eventData.skipTurn) {
        delete newActivePlayer.eventData.skipTurn;
        activePlayerIndex++;
        newActivePlayer =
          this.playerList[(activePlayerIndex + 1) % this.playerList.length];
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
      joinPort.linkedBridge = bridgeCode;
      targetPort.linkedBridge = bridgeCode;
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
      const bridge = new Bridge(data, { parent: this });
      this.bridgeList.push(bridge);

      if (data.zoneList?.length) {
        data.zoneList.forEach((item) => {
          bridge.zoneList.push(new Zone(item, { parent: bridge }));
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
      if (!this.eventHandlers[handler])
        throw new Error('eventHandler not found');
      this.eventHandlers[handler].push(source._id.toString());
    }
    deleteEventHandler({ handler, source }) {
      if (!this.eventHandlers[handler])
        throw new Error('eventHandler not found');
      this.eventHandlers[handler] = this.eventHandlers[handler].filter(
        (_id) => _id !== source._id.toString()
      );
    }
    callEventHandlers({ handler, data }) {
      if (!this.eventHandlers[handler])
        throw new Error('eventHandler not found');
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
  };
};
