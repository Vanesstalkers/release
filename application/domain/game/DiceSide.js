(class DiceSide extends domain.game['!GameObject'] {
  constructor(data, { parent }) {
    super(data, { col: 'diceside', parent });

    this.value = data.value;
  }
});
