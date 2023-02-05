(class DiceSide extends domain.game['!GameObject'] {
  constructor(data, { parent }) {
    super(data, { parent });

    this.value = data.value;
  }
});
