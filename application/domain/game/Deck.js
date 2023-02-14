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
  addItem(item) {
    const itemClass = this.getItemClass();
    if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
    this.assign('itemMap', { [item._id]: {} });
    return true;
  }
  removeItem(itemToRemove) {
    this.delete('itemMap', itemToRemove._id);
  }
  getRandomItem() {
    const itemIds = Object.keys(this.itemMap);
    const id = itemIds[Math.floor(Math.random() * itemIds.length)];
    const store = this.getFlattenStore();
    return store[id];
  }
});
