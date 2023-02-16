(class Deck extends domain.game['!GameObject'] {
  itemMap = {};
  #itemClass;

  constructor(data, { parent }) {
    super(data, { col: 'deck', parent });

    this.type = data.type;
    this.subtype = data.subtype;
    this.itemType = data.itemType;
    this.settings = data.settings;
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
    if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
    this.getGame().markNew(item);
    this.assign('itemMap', { [item._id]: {} });
    return true;
  }
  removeItem(itemToRemove) {
    this.delete('itemMap', itemToRemove._id);
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
  getRandomItem() {
    const itemIds = Object.keys(this.itemMap);
    const id = itemIds[Math.floor(Math.random() * itemIds.length)];
    const store = this.getFlattenStore();
    return store[id];
  }
});
