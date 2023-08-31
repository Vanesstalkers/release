(class DiceSide extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'diceside', parent });
    this.broadcastableFields(['_id', 'value', 'eventData', 'activeEvent']);

    this.set({ value: data.value });
  }
  prepareBroadcastData({ data, player }) {
    let visibleId = this._id;
    let preparedData = {};
    const bFields = this.broadcastableFields();
    let fake = false;
    const dice = this.getParent();
    const diceParent = dice.getParent();
    if (diceParent.matches({ className: 'Deck' })) {
      if (!diceParent.access[player?._id] && !dice.visible) {
        fake = true;
        visibleId = this.fakeId[diceParent.id()];
      }
    }
    if (!fake) {
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) preparedData[key] = value;
      }
    }
    return { visibleId, preparedData };
  }
});
