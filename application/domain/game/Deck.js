(class Deck extends lib.game.gameObject {
  itemMap = {};
  #itemClass;

  constructor(data, { parent }) {
    super(data, { col: 'deck', parent });
    this.broadcastableFields(['_id', 'code', 'type', 'subtype', 'itemMap']);

    this.set({
      type: data.type,
      subtype: data.subtype,
      itemType: data.itemType,
      settings: data.settings,
      access: data.access,
    });
  }
  prepareBroadcastData({ data, player }) {
    let preparedData = {};
    const bFields = this.broadcastableFields();
    const fakeIdParent = this.id();
    const parent = this.getParent();
    const game = this.game();
    if (parent.matches({ className: 'Game' })) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'itemMap' && !this.access[player?._id]) {
          const ids = {};
          for (const [idx, [id, val]] of Object.entries(value).entries()) {
            const item = game.getObjectById(id); // item мог быть перемещен
            ids[item.fakeId[fakeIdParent]] = val;
          }
          preparedData.itemMap = ids;
        } else {
          if (bFields.includes(key)) preparedData[key] = value;
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
              const item = game.getObjectById(id); // item мог быть перемещен
              const fakeId = item.fakeId[fakeIdParent];
              if (item.visible) {
                ids[id] = val;
                ids[fakeId] = null; // если не удалить, то будет задвоение внутри itemMap на фронте
              } else {
                ids[fakeId] = val;
              }
            }
          }
          preparedData.itemMap = ids;
        } else {
          if (bFields.includes(key)) preparedData[key] = value;
        }
      }
    } else {
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) preparedData[key] = value;
      }
    }
    return { visibleId: this._id, preparedData };
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
    const parentId = this.id();
    const itemClass = this.getItemClass();
    if (item.constructor != itemClass) {
      item = new itemClass(item, { parent: this });
      if (!item.fakeId?.[parentId]) item.updateFakeId({ parentId });
    }
    this.game().markNew(item);
    if (item.sideList) {
      this.game().markNew(item.sideList[0]);
      this.game().markNew(item.sideList[1]);
    }
    this.set({ itemMap: { [item._id]: {} } });
    return true;
  }
  removeItem(itemToRemove, { deleteFromStorage = false } = {}) {
    this.set({ itemMap: { [itemToRemove._id]: null } });
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
