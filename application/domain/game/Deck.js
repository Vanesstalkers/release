(class Deck extends domain.game['!GameObject'] {
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
});
