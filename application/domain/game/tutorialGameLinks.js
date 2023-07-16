({
  planeControls: {
    pos: 'bottom-left',
    text: 'Вы можете управлять положением и размером игрового поля с помощью кнопок в верхнем левом углу экрана.',
    active: '.gameplane-controls',
    buttons: [{ text: 'Продолжай', step: 'planeControlsMouseLeft' }],
  },
  planeControlsMouseLeft: {
    pos: 'bottom-left',
    text: 'При зажатой левой кнопке мыши можно перемещать игровое поле.',
    img: '/img/tutorial/mouse-left.png',
    buttons: [{ text: 'Продолжай', step: 'planeControlsMouseRight' }],
  },
  planeControlsMouseRight: {
    pos: 'bottom-left',
    text: 'При зажатой правой кнопке мыши можно вращать игровое поле.',
    img: '/img/tutorial/mouse-right.png',
    buttons: [{ text: 'Продолжай', step: 'planeControlsMouseMiddle' }],
  },
  planeControlsMouseMiddle: {
    pos: 'bottom-left',
    text: 'Колесиком мыши можно приближать и удалять игровое поле.',
    img: '/img/tutorial/mouse-middle.png',
    buttons: [{ text: 'Спасибо', action: 'exit' }],
  },
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
    text: 'Это карты событий, которые доступных для розыгрыша или уже были разыграны. Если нажать на иконку с восклицательным знаком на карте, то можно получить подсказку.',
    active: '[code="Deck[card_active]"]',
    buttons: [{ text: 'Спасибо', action: 'exit' }],
  },
  leaveGame: {
    pos: 'top-right',
    text: 'Для выхода из игры необходимо нажать эту кнопку, либо выбрать соответствующий пункт в меню.',
    active: '.leave-game-btn',
    buttons: [{ text: 'Спасибо', action: 'exit' }],
  }
});
