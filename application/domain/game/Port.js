(class Port extends domain.game['!GameObject'] {
  static DIRECTIONS = {
    top: {
      oppositeDirection: 'bottom',
      nextDirection: 'right',
      bridge: { vertical: true, reverse: true },
    },
    right: {
      oppositeDirection: 'left',
      nextDirection: 'bottom',
      bridge: {},
    },
    bottom: {
      oppositeDirection: 'top',
      nextDirection: 'left',
      bridge: { vertical: true },
    },
    left: {
      oppositeDirection: 'right',
      nextDirection: 'top',
      bridge: { reverse: true },
    },
  };

  width = 73;
  height = 73;

  constructor(data, { parent }) {
    super(data, { parent });

    this.left = data.left;
    this.top = data.top;
    this.direct = data.direct;
    this.links = data.links || {};
    this.linkedBridge = data.linkedBridge;
  }

  getDirect() {
    return Object.entries(this.direct).find(([direct, value]) => value)[0];
  }
  updateDirect(newDirect) {
    const directKeys = Object.keys(this.direct);

    if (newDirect) {
      if (this.direct[newDirect] !== undefined) {
        for (const direct of directKeys) this.direct[direct] = false;
        this.direct[newDirect] = true;

        return true;
      } else {
        return false;
      }
    } else {
      let usedDirectionIndex = 0;
      for (let i = 0; i < directKeys.length; i++) {
        if (this.direct[directKeys[i]]) usedDirectionIndex = i;
        this.direct[directKeys[i]] = false;
      }
      const newDirectionIndex = (usedDirectionIndex + 1) % directKeys.length;
      this.direct[directKeys[newDirectionIndex]] = true;

      return directKeys[newDirectionIndex];
    }
  }
});
