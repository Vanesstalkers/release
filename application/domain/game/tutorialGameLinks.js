({
  handPlanes: {
    pos: 'top-right',
    text: 'Выберите один блок и положите его на поле.',
    active: { selector: '.plane.in-hand', update: { step: 'handPlanesAvailablePlace' } },
    buttons: [
      { text: 'Продолжай', step: 'handPlanesAvailablePlace' },
      { text: 'Я разберусь', action: 'exit' },
    ],
  },
  handPlanesAvailablePlace: {
    pos: 'top-right',
    text: 'Выберите к какому блоку следует его присоединить.',
    active: { selector: '.fake-plane', update: { action: 'exit' } },
    buttons: [{ text: 'Спасибо', action: 'exit' }],
  },

  cardActive: {
    pos: 'bottom-right',
    text: 'Это карты событий, которые доступных для розыгрыша или уже были разыграны. Если нажать на карту, то можно получить подсказку.',
    active: '[code="Deck[card_active]"]',
    buttons: [{ text: 'Спасибо', action: 'exit' }],
  },
});
