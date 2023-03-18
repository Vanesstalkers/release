({
  init: async function ({ game, player }) {
    player.set('eventData', { extraTurn: true });
  },
});
