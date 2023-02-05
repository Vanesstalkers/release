(class Player extends domain.game['!hasPlane'](domain.game['!hasDeck'](domain.game['!GameObject'])) {
  constructor(data, { parent }) {
    super(data, { parent });

    this.active = data.active;
  }
});
