({
  init: function ({ game, player: activePlayer }) {
    if (game.isSinglePlayer()) {
      const deck = game.getObjectByCode('Deck[domino]');
      const hand = activePlayer.getObjectByCode('Deck[domino]');
      deck.moveRandomItems({ count: 1, target: hand });
      return { removeHandlers: true };
    } else {
      let diceFound = false;
      for (const player of game.getObjects({ className: 'Player' })) {
        if (player === activePlayer) continue;
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set({ activeEvent: { sourceId: this._id } });
          diceFound = true;
        }
        player.set({ activeEvent: { showDecks: true, sourceId: this._id } });
      }
      if (diceFound) game.set({ activeEvent: { sourceId: this._id } });
    }
  },
  handlers: {
    resetEvent: function ({ game, player: activePlayer }) {
      game.set({ activeEvent: null });
      for (const player of game.getObjects({ className: 'Player' })) {
        if (player === activePlayer) continue;
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set({ activeEvent: null });
        }
        player.set({ activeEvent: null });
      }
    },
    eventTrigger: function ({ game, player: activePlayer, targetId: fakeId, targetPlayerId }) {
      this.callHandler({ handler: 'resetEvent' });

      if (!fakeId || !targetPlayerId) return;
      const targetPlayer = game.getObjectById(targetPlayerId);
      if (!targetPlayer) return;
      const targetPlayerHand = targetPlayer.getObjectByCode('Deck[domino]');
      const handId = targetPlayerHand.id();
      const dice = targetPlayerHand
        .getObjects({ className: 'Dice' })
        .find((dice) => dice.fakeId[handId] === fakeId || dice.id() === fakeId);
      if (!dice) return;

      const playerHand = activePlayer.getObjectByCode('Deck[domino]');
      dice.moveToTarget(playerHand);

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.title}".`,
        userId: targetPlayer.userId,
      });

      return { timerOverdueOff: true };
    },
    timerOverdue: function ({ game, player: activePlayer }) {
      const players = game.getObjects({ className: 'Player' });
      const activePlayerIdx = players.indexOf(activePlayer);
      const sortedPlayers = players.slice(activePlayerIdx + 1).concat(players.slice(0, activePlayerIdx));
      const dices = sortedPlayers.reduce((arr, player) => {
        const sameTeam = false;
        if (sameTeam) return arr; // тут будет проверка на однокомандника
        return arr.concat(player.getObjectByCode('Deck[domino]').getObjects({ className: 'Dice' }));
      }, []);
      const dice = dices[0];
      if (!dice) {
        this.callHandler({ handler: 'resetEvent' });
      } else {
        const playerHand = dice.parent();
        const player = playerHand.parent();
        this.callHandler({
          handler: 'eventTrigger',
          data: {
            targetId: dice.fakeId[playerHand.id()],
            targetPlayerId: player.id(),
          },
        });
      }
    },
  },
});
