(class Port extends lib.game.gameObject {
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
    super(data, { col: 'port', parent });

    this.set({
      left: data.left,
      top: data.top,
      direct: data.direct,
      links: data.links || {},
      linkedBridge: data.linkedBridge,
    });
  }

  getDirect() {
    return Object.entries(this.direct).find(([direct, value]) => value)[0];
  }
  updateDirect(newDirect) {
    const directKeys = Object.keys(this.direct);

    if (newDirect) {
      if (this.direct[newDirect] !== undefined) {
        const directions = {};
        for (const direct of directKeys) directions[direct] = false;
        directions[newDirect] = true;
        this.set({ direct: directions });

        return true;
      } else {
        return false;
      }
    } else {
      const directions = {};
      let usedDirectionIndex = 0;
      for (let i = 0; i < directKeys.length; i++) {
        if (this.direct[directKeys[i]]) usedDirectionIndex = i;
        directions[directKeys[i]] = false;
      }
      const newDirectionIndex = (usedDirectionIndex + 1) % directKeys.length;
      directions[directKeys[newDirectionIndex]] = true;
      this.set({ direct: directions });

      return directKeys[newDirectionIndex];
    }
  }
});
