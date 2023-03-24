(class Player extends domain.game['!hasPlane'](domain.game['!hasDeck'](domain.game['!GameObject'])) {
  constructor(data, { parent }) {
    super(data, { col: 'player', parent });

    this.userId = data.userId;
    this.active = data.active;
    this.ready = data.ready;
    this.timerEndTime = data.timerEndTime;
  }
});
