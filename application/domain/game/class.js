() => {

  class GameObject {

    _id;
    #parent;
    #parentList;
    #_objects = {};
    #fakeParent = null;

    constructor(data, { parent } = {}) {

      if (!this._id) this._id = data._id || db.mongo.ObjectID();

      this.setParent(parent);
      this.addToParentsObjectStorage();

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
      //   const storageCode = this.addToParentsObjectStorage();
      //   this.storageCode = data.storageCode || storageCode;
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
    getObjects() {
      return this.#_objects;
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
  }

  const hasDeck = Base => class extends Base {

    addDeck(data, { deckClass = Deck, deckListName = 'deckList' } = {}) {

      if (!this[deckListName]) this[deckListName] = [];
      const deck = new deckClass(data, { parent: this });
      this[deckListName].push(deck);

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

      if (data.portList?.length) data.portList.forEach(item => plane.addPort(item));
      if (data.zoneList?.length) data.zoneList.forEach(item => plane.addDeck(item, { deckClass: Zone, deckListName: 'zoneList' }));

      if (data.zoneLinks) {
        Object.entries(data.zoneLinks).forEach(([zoneCode, sideList])=>{
          Object.entries(sideList).forEach(([sideCode, links])=>{
            links.forEach(link=>{
              const [linkZoneCode, linkSideCode] = link.split('.');
              const zone = plane.getObjectByCode(zoneCode);
              const side = zone.getObjectByCode(sideCode);
              const linkZone = plane.getObjectByCode(linkZoneCode);
              const linkSide = linkZone.getObjectByCode(linkSideCode);
              console.log({zoneCode, sideCode, linkZoneCode, linkSideCode, zone, side, linkZone, linkSide});
              side.addLink( linkSide.code );
              linkSide.addLink( side.code );
            });
          });
        });
      }
    }
  }

  class Dice extends GameObject {
    constructor(data, { parent }) {
      super(data, { parent });

      if(data.sideList){

        this.side1 = data.side1;
        this.side2 = data.side2;

        this.sideList = [
          new DiceSide(data.sideList[0], { parent: this }), 
          new DiceSide(data.sideList[1], { parent: this }),
        ];
      }else{

        if (Math.random() > 0.5) data.reverse();
        this.side1 = data[0];
        this.side2 = data[1];

        this.sideList = [
          new DiceSide({_code: 1, value: data[0]}, { parent: this }), 
        new DiceSide({_code: 1, value: data[0]}, { parent: this }), 
          new DiceSide({_code: 1, value: data[0]}, { parent: this }), 
          new DiceSide({_code: 2, value: data[1]}, { parent: this }),
        ];
      }
    }
    customObjectCode({ codeTemplate, replacementFragment }, data) {
      return codeTemplate.replace(replacementFragment, ''+data[0]+data[1]);
    }

    moveToTarget(target) {
      const currentParent = this.getParent();
      currentParent.itemList = currentParent.itemList.filter(item => item != this);
      target.addItem(this);

      this.updateParent(target);
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

    constructor(data, { parent }) {
      super(data, { parent });

      this.type = data.type;
      this.itemType = data.itemType;
    }
    customObjectCode({ codeTemplate, replacementFragment }, data) {
      return codeTemplate.replace(replacementFragment, data.type);
    }

    getItemClass() {
      return this.type == 'domino' ? Dice : Card;
    }
    addItem(item) {
      const itemClass = this.getItemClass();
      if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
      this.itemList.push(item);
    }
    getRandomItem() {
      return this.itemList[Math.floor(Math.random() * this.itemList.length)];
    }
  }

  class Zone extends Deck {

    constructor(data, { parent }) {
      super(data, { parent });

      this.left = data.left;
      this.top = data.top;
      this.vertical = data.vertical;
      this.links = data.links;

      if(data.sideList){

        this.side1 = data.side1;
        this.side2 = data.side2;

        this.sideList = [
          new ZoneSide(data.sideList[0], { parent: this }), 
          new ZoneSide(data.sideList[1], { parent: this }),
        ];
      }else{

        this.sideList = [
          new ZoneSide({_code: 1, value: data[0]}, { parent: this }), 
        new ZoneSide({_code: 1, value: data[0]}, { parent: this }), 
          new ZoneSide({_code: 1, value: data[0]}, { parent: this }), 
          new ZoneSide({_code: 2, value: data[1]}, { parent: this }),
        ];
      }
    }
    customObjectCode() { return this.default_customObjectCode(...arguments) } // иначе подставится метод из Deck

    getItemClass() { // в zone не приходит type, поэтому переопределяем метод
      return Dice;
    }
  }
  class ZoneSide extends GameObject {
    
    value;
    links;

    constructor(data, { parent }) {
      super(data, { parent });

      this.value = data.value || null;
      this.links = data.links || [];
    }

    addLink(link) {
      this.links.push(link);
    }
  }

  class Port extends GameObject {

    static ROTATIONS = {
      top: { oppositeDirection: "bottom", nextDirection: "right" },
      right: { oppositeDirection: "left", nextDirection: "bottom" },
      bottom: { oppositeDirection: "top", nextDirection: "left" },
      left: { oppositeDirection: "right", nextDirection: "top" },
    }

    width = 73;
    height = 73;

    constructor(data, { parent }) {
      super(data, { parent });

      this.left = data.left;
      this.top = data.top;
      this.direct = data.direct;
    }

    getDirect() {
      return Object.entries(this.direct).find(([direct, value]) => value)[0];
    }
  }

  class Plane extends hasDeck(GameObject) {

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
  }

  class Player extends hasPlane(hasDeck(GameObject)) {
    constructor(data, { parent }) {
      super(data, { parent });

      this.active = data.active;
    }
  }

  return class Game extends hasPlane(hasDeck(GameObject)) {

    playerList = [];

    constructor(data = {}) {
      super(data);

      delete this.code; // мешается в ZoneSide.links + в принципе не нужен
    }

    fromJSON(data) {

      this.addTime = data.addTime;
      this.config = data.config;
      this.round = data.round;

      if (data.playerList?.length) data.playerList.forEach(item => this.addPlayer(item));
      if (data.planeList?.length) data.planeList.forEach(item => this.addPlane(item));
      if (data.deckList?.length) data.deckList.forEach(item => this.addDeck(item));

      return this;
    }
    addPlayer(data) {

      const player = new Player(data, { parent: this });
      this.playerList.push(player);

      if (data.planeList?.length) data.planeList.forEach(item => player.addPlane(item));
      if (data.deckList?.length) data.deckList.forEach(item => player.addDeck(item));
    }
    changeActivePlayer() {

      const activePlayerIndex = this.playerList.findIndex(player => player.active);
      this.playerList[activePlayerIndex].active = false;
      const newActivePlayer = this.playerList[(activePlayerIndex + 1) % this.playerList.length];
      newActivePlayer.active = true;

      return newActivePlayer;
    }
    linkPlanes(data) {
      domain.game.linkPlanes(data);
    }
  }
}