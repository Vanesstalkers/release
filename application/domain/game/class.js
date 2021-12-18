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
        const codeTemplate = this.getCodeTemplate(this.constructor.name + '[' + replacementFragment + ']');
        this.code = customObjectCode.call(this, { codeTemplate, replacementFragment }, data);
      } else {
        this.code = this.getCodeTemplate(this.constructor.name + '[' + (data._code || '') + ']');
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
        } while (parent = parent.getParent());
      }
    }
    addToObjectStorage(obj) {
      this.#_objects[obj._id] = obj;
    }
    deleteFromParentsObjectStorage() {
      let parent = this.getParent();
      do {
        parent.deleteFromObjectStorage(this);
      } while (parent = parent.getParent());
    }
    deleteFromObjectStorage(obj) {
      if (this.#_objects[obj._id]) delete this.#_objects[obj._id];
    }
    getObjectById(_id) { // _id всегда уникален
      return this.#_objects[_id];
    }
    getObjectByCode(code) { // внутри одного родителя code может быть не уникален
      return Object.values(this.#_objects).find(obj => {
        obj.setFakeParent(this);
        const result = obj.code === obj.getCodeTemplate(code);
        obj.setFakeParent(null);
        return result;
      });
    }
    getCodePrefix() {
      return this.getParent()?.code || '';
    }
    getCodeSuffix() { return '' }
    getCodeTemplate(_code) {
      return '' + this.getCodePrefix() + _code + this.getCodeSuffix();
    }
    getObjects(filter) {
      let result = Object.values(this.#_objects);
      if (filter) {
        if (filter.className) result = result.filter(obj => obj.constructor.name === filter.className);
        if (filter.directParent) result = result.filter(obj => obj.getParent() === filter.directParent);
      }
      return result;
    }
    setParent(parent) {
      if (parent) {
        this.#parent = parent;
        this.#parentList = (parent.getParentList() || []).concat(parent);
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
    getAllLinks() {
      return {
        parent: this.getParent(),
        parentList: this.getParentList(),
        objects: this.getObjects(),
      }
    }
    getGame() {
      return this.#game;
    }
    setGame(game) {
      this.#game = game;
    }
  }

  const hasDeck = Base => class extends Base {
    addDeck(data, { deckClass = Deck, deckListName = 'deckList', deckItemClass = Dice } = {}) {

      if (!this[deckListName]) this[deckListName] = [];
      const deck = new deckClass(data, { parent: this });
      this[deckListName].push(deck);

      deck.setItemClass(deckItemClass);

      if (data.itemList?.length) {
        data.itemList.forEach(item => deck.addItem(item));
      }
    }
  }
  const hasPlane = Base => class extends Base {

    planeList = [];

    addPlane(data) {

      const plane = new Plane(data, { parent: this });
      this.planeList.push(plane);

      return plane;
    }
  }

  class Dice extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      this.rotate(data.rotation);

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
    rotate(rotation) {
      if (rotation) {
        this.rotation = true;
      } else {
        if (this.rotation) delete this.rotation;
      }
    }
  }
  class DiceSide extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      this.value = data.value;
    }
  }

  class Card extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });
    }
  }

  class Deck extends GameObject {

    itemList = [];
    #itemClass;

    constructor(data, { parent }) {
      super(data, { parent });

      this.type = data.type;
      this.itemType = data.itemType;
    }
    customObjectCode({ codeTemplate, replacementFragment }, data) {
      return codeTemplate.replace(replacementFragment, data.type);
    }

    setItemClass(itemClass) {
      this.#itemClass = itemClass;
    }
    getItemClass() {
      return this.#itemClass;
    }
    addItem(item) {
      const itemClass = this.getItemClass();
      if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
      this.itemList.push(item);
      return true;
    }
    removeItem(itemToRemove) {
      this.itemList = this.itemList.filter(item => item != itemToRemove);
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
      this.links = data.links;

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
        data.itemList.forEach(item => {
          const itemClass = this.getItemClass();
          if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
          this.itemList.push(item);
        });
      }
    }
    customObjectCode() { return this.default_customObjectCode(...arguments) } // иначе подставится метод из Deck

    getItemClass() {
      return Dice;
    }
    addItem(item) {
      const itemClass = this.getItemClass();
      if (item.constructor != itemClass) item = new itemClass(item, { parent: this });

      const available = this.checkIsAvailable(item);
      if (available) {
        const itemSideList = [...item.sideList];
        item.rotate(false);
        if (available === 'rotate') {
          itemSideList.reverse();
          item.rotate(true);
        }

        this.sideList.forEach((side, sideIndex) => {
          const itemSide = itemSideList[sideIndex];
          side.value = itemSide.value;
          side.links.forEach(linkCode => {
            this.getGame().getObjectByCode(linkCode).updateExpectedValues();
          });
        });

        this.itemList.push(item);
      }

      return available;
    }
    removeItem(itemToRemove) {
      this.sideList.forEach(side => {
        delete side.value;
        side.links.forEach(linkCode => {
          this.getGame().getObjectByCode(linkCode).updateExpectedValues();
        });
      });

      this.itemList = this.itemList.filter(item => item != itemToRemove);
    }
    checkIsAvailable(dice) {
      if (this.itemList.length) return false; // zone уже занята

      const expectedValues0 = this.sideList[0].expectedValues;
      const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
      const expectedValues1 = this.sideList[1].expectedValues;
      const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

      if (this.getParent().constructor.name === 'Bridge' &&
        (!sizeOfExpectedValues0 || !sizeOfExpectedValues1))
        return false; // для bridge-zone должны быть заполнены соседние zone

      if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1)
        return true; // соседние zone свободны

      if (
        (!sizeOfExpectedValues0 ||
          (expectedValues0[dice.sideList[0].value] && sizeOfExpectedValues0 === 1))
        &&
        (!sizeOfExpectedValues1 ||
          (expectedValues1[dice.sideList[1].value] && sizeOfExpectedValues1 === 1))
      ) return true;
      if (
        (!sizeOfExpectedValues0 ||
          (expectedValues0[dice.sideList[1].value] && sizeOfExpectedValues0 === 1))
        &&
        (!sizeOfExpectedValues1 ||
          (expectedValues1[dice.sideList[0].value] && sizeOfExpectedValues1 === 1))
      ) return 'rotate';

      return false;
    }
  }
  class ZoneSide extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      this.value = data.value || undefined;
      this.links = data.links || [];
      this.expectedValues = data.expectedValues || {};
    }

    addLink(link) {
      this.links.push(link);
    }
    updateExpectedValues() {
      this.expectedValues = {};
      this.links.forEach(linkCode => {
        const link = this.getGame().getObjectByCode(linkCode);
        if (link.value !== undefined) this.expectedValues[link.value] = true;
      });
    }
  }

  class Port extends GameObject {

    static DIRECTIONS = {
      top: {
        oppositeDirection: "bottom", nextDirection: "right",
        bridge: { vertical: true, reverse: true }
      },
      right: {
        oppositeDirection: "left", nextDirection: "bottom",
        bridge: {}
      },
      bottom: {
        oppositeDirection: "top", nextDirection: "left",
        bridge: { vertical: true }
      },
      left: {
        oppositeDirection: "right", nextDirection: "top",
        bridge: { reverse: true }
      },
    }

    width = 73;
    height = 73;

    constructor(data, { parent }) {
      super(data, { parent });

      this.left = data.left;
      this.top = data.top;
      this.direct = data.direct;
      this.links = data.links;
      this.linkedBridge = data.linkedBridge;
    }

    getDirect() {
      return Object.entries(this.direct).find(([direct, value]) => value)[0];
    }
    updateDirect(newDirect) {

      const directKeys = Object.keys(this.direct);

      if (newDirect) {
        if (this.direct[newDirect] !== undefined) {
          
          for (const direct of directKeys)this.direct[direct] = false;
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

      this.left = data.left || 0;
      this.top = data.top || 0;
      this.rotation = data.rotation || 0;
      if (data.width) this.width = data.width;
      if (data.height) this.height = data.height;

      if (data.portList?.length) data.portList.forEach(item => this.addPort(item));
      if (data.zoneList?.length) {
        data.zoneList.forEach(item => {
          this.zoneList.push(new Zone(item, { parent: this }));
        });
      }
      if (data.zoneLinks) {
        Object.entries(data.zoneLinks).forEach(([zoneCode, sideList]) => {
          Object.entries(sideList).forEach(([sideCode, links]) => {
            links.forEach(link => {
              const [linkZoneCode, linkSideCode] = link.split('.');
              const zone = this.getObjectByCode(zoneCode);
              const side = zone.getObjectByCode(sideCode);
              const linkZone = this.getObjectByCode(linkZoneCode);
              const linkSide = linkZone.getObjectByCode(linkSideCode);
              side.addLink(linkSide.code);
              linkSide.addLink(side.code);
            });
          });
        });
      }
    }

    addPort(data) {
      const port = new Port(data, { parent: this });
      this.portList.push(port);
    }
    getZone({ code }) {
      return this.zoneList.find(zone => zone.code === code);
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
          }
        case 1:
          return {
            left: this.left - this.height,
            right: this.left,
            top: this.top,
            bottom: this.top + this.width,
          }
        case 2:
          return {
            left: this.left - this.width,
            right: this.left,
            top: this.top - this.height,
            bottom: this.top,
          }
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

      if (data.playerList?.length) data.playerList.forEach(item => this.addPlayer(item));
      // !!! надо перевести на Deck (по аналогии с Player)
      // if (data.planeList?.length) data.planeList.forEach(item => this.addDeck(item, {
      //   deckListName: 'planeList', deckItemClass: Plane,
      // }));
      if (data.planeList?.length) data.planeList.forEach(item => this.addPlane(item));
      if (data.deckList?.length) data.deckList.forEach(item => this.addDeck(item, {
        deckItemClass: item.type === 'domino' ? Dice : Card
      }));
      if (data.bridgeList?.length) data.bridgeList.forEach(item => this.addBridge(item));

      return this;
    }
    addPlayer(data) {

      const player = new Player(data, { parent: this });
      this.playerList.push(player);

      if (data.deckList?.length) data.deckList.forEach(item => player.addDeck(item, {
        deckItemClass: item.type === 'domino' ? Dice : (item.type === 'plane' ? Plane : Card)
      }));
    }
    changeActivePlayer() {

      const activePlayerIndex = this.playerList.findIndex(player => player.active);
      this.playerList[activePlayerIndex].active = false;
      const newActivePlayer = this.playerList[(activePlayerIndex + 1) % this.playerList.length];
      newActivePlayer.active = true;

      return newActivePlayer;
    }
    linkPlanes({ joinPort, targetPort, fake }) {
      const { targetLinkPoint } = domain.game.linkPlanes({ joinPort, targetPort });

      if (fake) return;

      const DIRECTIONS = joinPort.constructor.DIRECTIONS;
      const targetPortDirect = DIRECTIONS[targetPort.getDirect()];

      const joinPlane = joinPort.getParent();
      const targetPlane = targetPort.getParent();
      const joinPlaneZoneLink = [joinPlane.code + joinPort.links[0]];
      const targetPlaneZoneLink = [targetPlane.code + targetPort.links[0]];

      // !!! zoneLinks может быть несколько (links[...]) - пока что не актуально (нет таких Plane)

      const reverseLinks = targetPortDirect.bridge.reverse;
      const bridgeZoneLinks = {
        'Zone[1]': {
          [reverseLinks ? 'ZoneSide[2]' : 'ZoneSide[1]']: targetPlaneZoneLink,
          [reverseLinks ? 'ZoneSide[1]' : 'ZoneSide[2]']: joinPlaneZoneLink,
        }
      }
      const bridgeData = {
        _code: joinPlane.code + '-' + targetPlane.code,
        left: targetLinkPoint.left,
        top: targetLinkPoint.top,
        rotation: targetPlane.rotation,
        zoneLinks: bridgeZoneLinks,
        zoneList: [
          {
            _code: 1, left: 0, top: 0, itemType: 'any',
            vertical: targetPortDirect.bridge.vertical
          },
        ],
      }

      const bridgeCode = this.addBridge(bridgeData);
      joinPort.linkedBridge = bridgeCode;
      targetPort.linkedBridge = bridgeCode;
    }
    checkPlaneCollysion(checkPlane) {
      const planePosition = checkPlane.getPosition();

      function checkCollysion(pos1, pos2) {
        return !(
          (pos1.bottom < pos2.top) ||
          (pos1.top > pos2.bottom) ||
          (pos1.right < pos2.left) ||
          (pos1.left > pos2.right)
        );
      }

      const collysionList = [];
      this.getObjects({ className: 'Plane', directParent: this }).forEach(plane => {
        if (plane !== checkPlane) {
          if (checkCollysion(planePosition, plane.getPosition())) {
            collysionList.push(plane.code);
          }
        }
      });

      return { collysionList, planePosition };
    }
    addBridge(data) {

      const bridge = new Bridge(data, { parent: this });
      this.bridgeList.push(bridge);

      if (data.zoneList?.length) {
        data.zoneList.forEach(item => {
          bridge.zoneList.push(new Zone(item, { parent: bridge }));
        });
      }
      if (data.zoneLinks) {
        Object.entries(data.zoneLinks).forEach(([zoneCode, sideList]) => {
          Object.entries(sideList).forEach(([sideCode, links]) => {
            links.forEach(link => {
              const [linkZoneCode, linkSideCode] = link.split('.');
              const zone = bridge.getObjectByCode(zoneCode);
              const side = zone.getObjectByCode(sideCode);
              const linkZone = bridge.getGame().getObjectByCode(linkZoneCode);
              const linkSide = linkZone.getObjectByCode(linkSideCode);
              side.addLink(linkSide.code);
              linkSide.addLink(side.code);
            });
          });
        });
      }

      return bridge.code;
    }
    getZonesAvailability(dice) {
      const result = new Map();
      dice.getParent().removeItem(dice); // чтобы не мешать расчету для соседних зон (* ниже вернем состояние)
      this.getObjects({ className: 'Plane', directParent: this }).forEach(plane => {
        plane.getObjects({ className: 'Zone' }).forEach(zone => {
          const isAvailableStatus = zone.checkIsAvailable(dice);
          result.set(zone, isAvailableStatus);
        });
      });
      this.getObjects({ className: 'Bridge', directParent: this }).forEach(plane => {
        plane.getObjects({ className: 'Zone' }).forEach(zone => {
          const isAvailableStatus = zone.checkIsAvailable(dice);
          result.set(zone, isAvailableStatus);
        });
      });
      dice.getParent().addItem(dice); // * восстанавливаем состояние
      return result;
    }
  }
}