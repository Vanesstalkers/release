(class DiceSide extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'diceside', parent });

    this.set({ value: data.value });
  }
});
