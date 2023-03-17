(class Card extends domain.game['!GameObject'] {
  #events;

  constructor(data, { parent }) {
    super(data, { col: 'card', parent });

    this.name = data.name;
    this.played = data.played;
    this.#events = domain.cardEvent[this.name];
  }
  moveToTarget(target) {
    const currentParent = this.getParent();
    currentParent.removeItem(this); // сначала удаляем
    const moveResult = target.addItem(this);
    if (moveResult) {
      this.updateParent(target);
    } else {
      currentParent.addItem(this);
    }
    return moveResult;
  }
  getSelfConfig() {
    return { handlers: Object.keys(this.#events.handlers || {}) };
  }
  needAutoPlay() {
    return this.#events?.config?.autoPlay;
  }
  restoreAvailable() {
    if (this.#events?.config?.playOneTime) {
      return this.played ? false : true;
    } else {
      return true;
    }
  }
  play() {
    const game = this.getGame();
    const player = game.getActivePlayer();
    const config = this.getSelfConfig();
    for (const handler of config.handlers) game.addEventHandler({ handler, source: this });
    if (this.#events.init) this.#events.init.call(this, { game, player });
    this.set('played', Date.now());
  }
  callHandler({ handler, data = {} }) {
    if (!this.#events.handlers[handler]) throw new Error('eventHandler not found');
    const game = this.getGame();
    const player = game.getActivePlayer();
    if (data.targetId) data.target = game.getObjectById(data.targetId);
    return this.#events.handlers[handler].call(this, { game, player, ...data });
  }
});
