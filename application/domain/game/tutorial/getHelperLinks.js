() => ({
  gameControls: {
    selector: '.game-controls',
    tutorial: 'game-tutorial-gameControls',
    type: 'game',
    pos: { top: false, left: false },
    simple: false,
  },
  handPlanes: {
    selector: '.session-player .player.iam.active .hand-planes',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, right: true },
  },
  handDices: {
    selector: '.session-player .player.iam.active .hand-dices .domino-dice:first-child',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  handCards: {
    selector: '.session-player .player.iam.active .hand-cards .card-event:first-child',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  fieldPlane: {
    selector: '#game .plane',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  fieldBridge: {
    selector: '#game .bridge',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },  
  fieldZoneDouble: {
    selector: '#game .plane .zone.double',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },  
  cardActive: {
    selector: '[code="Deck[card_active]"] .card-event',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: false, left: true },
  },
  leaveGame: {
    selector: '.leave-game-btn',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
});
