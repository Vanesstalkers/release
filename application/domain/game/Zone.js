(class Zone extends domain.game['!GameObject'] {
  itemMap = {};

  constructor(data, { parent }) {
    super(data, { col: 'zone', parent });

    this.left = data.left || 0;
    this.top = data.top || 0;
    this.vertical = data.vertical;

    if (data.sideList) {
      this.sideList = [
        new domain.game.ZoneSide(data.sideList[0], { parent: this }),
        new domain.game.ZoneSide(data.sideList[1], { parent: this }),
      ];
    } else {
      this.sideList = [
        new domain.game.ZoneSide({ _code: 1, value: data[0] }, { parent: this }),
        new domain.game.ZoneSide({ _code: 2, value: data[1] }, { parent: this }),
      ];
    }

    if (data.itemMap) {
      data.itemList = [];
      for (const _id of Object.keys(data.itemMap)) {
        data.itemList.push(this.getStore().dice[_id]);
      }
    }
    for (let item of data.itemList || []) {
      const itemClass = this.getItemClass();
      // !!! странная конструкция (с присваиванием item) - надо перепроверить
      if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
      this.itemMap[item._id] = {};
    }
  }
  customObjectCode() {
    return this.default_customObjectCode(...arguments);
  } // иначе подставится метод из Deck

  getItemClass() {
    return domain.game.Dice;
  }
  addItem(item) {
    const itemClass = this.getItemClass();
    if (item.constructor != itemClass) item = new itemClass(item, { parent: this });

    const available = this.checkIsAvailable(item);
    if (available) {
      if (available === 'rotate') item.set('sideList', [...item.sideList.reverse()]);
      this.assign('itemMap', { [item._id]: {} });
      this.updateValues();
    }

    return available;
  }
  updateValues() {
    const item = this.getNotDeletedItem();
    this.sideList.forEach((side, sideIndex) => {
      if (item) {
        const itemSide = item.sideList[sideIndex];
        side.set('value', itemSide.value);
      } else {
        side.set('value', undefined);
      }
      for (const linkCode of Object.values(side.links)) {
        this.getGame().getObjectByCode(linkCode).updateExpectedValues();
      }
    });
  }
  removeItem(itemToRemove) {
    this.delete('itemMap', itemToRemove._id);
    this.updateValues();
  }
  getNotDeletedItem() {
    return Object.keys(this.itemMap)
      .map((_id) => this.getStore().dice[_id])
      .find((dice) => !dice.deleted);
  }
  checkIsAvailable(dice, { skipPlacedItem } = {}) {
    if (!skipPlacedItem && this.getNotDeletedItem()) return false; // zone уже занята

    if (this.findParent({ className: 'Player' }) !== undefined) return false; // это plane в руке player

    const expectedValues0 = this.sideList[0].expectedValues;
    const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
    const expectedValues1 = this.sideList[1].expectedValues;
    const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

    if (this.findParent({ className: 'Bridge' }) !== undefined && (!sizeOfExpectedValues0 || !sizeOfExpectedValues1))
      return false; // для bridge-zone должны быть заполнены соседние zone

    if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return true; // соседние zone свободны

    if (
      (!sizeOfExpectedValues0 || (expectedValues0[dice.sideList[0].value] && sizeOfExpectedValues0 === 1)) &&
      (!sizeOfExpectedValues1 || (expectedValues1[dice.sideList[1].value] && sizeOfExpectedValues1 === 1))
    )
      return true;
    if (
      (!sizeOfExpectedValues0 || (expectedValues0[dice.sideList[1].value] && sizeOfExpectedValues0 === 1)) &&
      (!sizeOfExpectedValues1 || (expectedValues1[dice.sideList[0].value] && sizeOfExpectedValues1 === 1))
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
    if (parent.getObjects({ className: 'Zone' }).find((zone) => !zone.getNotDeletedItem())) return false;
    parent.set('release', true);
    return true;
  }
});
