(class DiceSide extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'diceside', parent });
    this.broadcastableFields(['_id', 'value', 'eventData', 'activeEvent']);

    this.set({ value: data.value });
  }
});
