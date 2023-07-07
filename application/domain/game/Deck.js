(class Deck extends lib.game.gameObject {
  itemMap = {};
  #itemClass;

  constructor(data, { parent }) {
    super(data, { col: 'deck', parent });

    this.type = data.type;
    this.subtype = data.subtype;
    this.itemType = data.itemType;
    this.settings = data.settings;
    this.access = data.access;
  }
  prepareFakeData({ data, player }) {
    let result = {};
    const parent = this.getParent();
    if (parent.matches({ className: 'Game' })) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'itemMap' && !this.access[player?._id]) {
          const ids = {};
          for (const [idx, [id, val]] of Object.entries(value).entries()) {
            const item = this.getObjectById(id);
            ids[item.fakeId] = val;
          }
          result.itemMap = ids;
        } else {
          result[key] = value;
        }
      }
    } else if (parent.matches({ className: 'Player' })) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'itemMap') {
          const ids = {};
          for (const [idx, [id, val]] of Object.entries(value).entries()) {
            if (parent === player) {
              ids[id] = val;
            } else {
              const item = this.getObjectById(id);
              if (item.visible) {
                ids[id] = val;
              } else {
                ids[item.fakeId] = val;
              }
            }
          }
          result.itemMap = ids;
        } else {
          result[key] = value;
        }
      }
    } else {
      result = data;
    }
    return { visibleId: this._id, preparedData: result };
  }

  customObjectCode({ codeTemplate, replacementFragment }, data) {
    const replaceString = [data.type, data.subtype].filter((item) => item).join('_');
    return codeTemplate.replace(replacementFragment, replaceString);
  }

  setItemClass(itemClass) {
    this.#itemClass = itemClass;
  }
  getItemClass() {
    return this.#itemClass;
  }
  itemsCount() {
    return Object.keys(this.itemMap).length;
  }
  addItem(item) {
    const itemClass = this.getItemClass();
    if (item.constructor != itemClass) {
      item = new itemClass(item, { parent: this });
      if (!item.fakeId) item.updateFakeId();
    }
    this.getGame().markNew(item);
    this.set({ itemMap: { [item._id]: {} } });
    return true;
  }
  removeItem(itemToRemove, { deleteFromStorage = false } = {}) {
    this.set({ itemMap: { ...this.itemMap, [itemToRemove._id]: null } });
    if (deleteFromStorage) this.deleteFromObjectStorage(itemToRemove);
  }
  moveAllItems({ target }) {
    const store = this.getFlattenStore();
    const itemIds = Object.keys(this.itemMap);
    for (const id of itemIds) store[id].moveToTarget(target);
  }
  moveRandomItems({ count, target }) {
    for (let i = 0; i < count; i++) {
      const item = this.getRandomItem();
      if (item) item.moveToTarget(target);
    }
  }
  getRandomItem({ skipArray = [] } = {}) {
    const itemIds = Object.keys(this.itemMap).filter((_id) => !skipArray.includes(_id));
    if (itemIds.length === 0) return null;
    const id = itemIds[Math.floor(Math.random() * itemIds.length)];
    const store = this.getFlattenStore();
    return store[id];
  }
});
