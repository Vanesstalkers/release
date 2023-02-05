(class Card extends domain.game['!GameObject'] {
  #events;

  constructor(data, { parent }) {
    super(data, { parent });

    this.name = data.name;
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
    return {
      handlers: Object.keys(this.#events.handlers),
    };
  }
  needAutoPlay() {
    return this.#events?.config?.autoPlay;
  }
  play() {
    const config = this.getSelfConfig();
    (config.handlers || []).forEach((handler) =>
      this.getGame().addEventHandler({ handler, source: this })
    );
    if (this.#events.init) this.#events.init.call(this);
  }
  callHandler({ handler, data }) {
    if (!this.#events.handlers[handler])
      throw new Error('eventHandler not found');
    return this.#events.handlers[handler].call(this, data);
  }
});
