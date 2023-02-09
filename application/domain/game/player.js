(class Player extends domain.game['!hasPlane'](domain.game['!hasDeck'](domain.game['!GameObject'])) {
  constructor(data, { parent }) {
    super(data, { col: 'player', parent });

    this.active = data.active;
  }
});
