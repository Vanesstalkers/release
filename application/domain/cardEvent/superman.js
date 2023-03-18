({
  init: async function ({ game, player }) {
    player.set('eventData', { disablePlayerHandLimit: true });
  },
});
