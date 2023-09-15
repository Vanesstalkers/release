({
  steps: {
    gameControls: {
      pos: 'bottom-left',
      text: 'Вы можете управлять положением и размером игрового поля с помощью кнопок в верхнем левом углу экрана.',
      active: '.gameplane-controls',
    },
    planeControls: {
      pos: 'bottom-left',
      text: 'Вы можете управлять положением и размером игрового поля с помощью кнопок в верхнем левом углу экрана.',
      active: '.gameplane-controls',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $controls = $rootEl.querySelector('.gameplane-controls');
          if (!$controls) $rootEl.querySelector('.move.gui-btn')?.click();
        },
      },
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
    handDices: {
      pos: 'top-right',
      text: 'В начале каждого хода в руку добавляется по одной костяшке. В течение своего хода можно выложить на поле сколько угодно костяшек из руки. Если в конце хода в руке остается больше костяшек, чем определено правилами, то они сбрасываются в колоду.',
      active: '.player.iam .hand-dices .domino-dice',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    handCards: {
      pos: 'top-right',
      text: 'В течение своего хода можно разыгрывать сколько угодно карт-событий из руки, после чего срабатывает их эффект, а сами карты попадают в колоду сброса. Для получения новых карт в руку необходимо инициировать событие "РЕЛИЗ" (закрыть блок или интеграцию).',
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [{ text: 'Продолжай', step: 'handCardsEvents' }],
    },
    handCardsEvents: {
      pos: 'top-right',
      text: 'Карты с активным эффектом блокируют розыгрыш других карт или размещения костяшек - нужно выполнить обязательное действие (например, выбрать игрока или костяшку). Описание каждого эффекта можно прочитать на самой карте, приблизив ее нажатием иконки в правом верхнем углу (появляется при наведении на карту).',
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    fieldPlane: {
      pos: 'bottom-right',
      text: 'Цель игры в том, чтобы заполнить костяшками все зоны всех блоков и интеграций на игровом поле. Размещать костяшки можно только по правилам домино. Допускается поворачивать уже размещенные костяшки или менять их на новые из руки (для этого нужно выбрать соответствующее действие на самой костяшке). Запрещено менять костяшки, размещенные на текущем ходу.',
      active: '#game .zone',
      buttons: [{ text: 'Продолжай', step: 'release' }],
    },
    release: {
      pos: 'bottom-right',
      text: 'При заполнении всех зон одного блока, либо зоны интеграции, игрок получает карту-события себе в руку. Данное событие на называется "РЕЛИЗ" и оно происходит только один раз для каждого блока/интеграции. Однако некоторые карты-событий могут активировать эффект, который позволит совершить "РЕЛИЗ" повторно (это относится ко всем картам, которые снимают костяшки с игрового поля).',
      active: '#game .plane, #game .bridge .zone',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    fieldBridge: {
      pos: 'bottom-right',
      text: 'Для зон интеграции действуют особые правила:\r\n1. Их можно заполнить только после того, как заполнены соседние зоны прилагающих блоков;\r\n2. Их нельзя поворачивать (только менять на новые);\r\n3. Заполнение каждой зоны интеграции (в том числе добавленными картами "Требования правительства" и "Требования налоговой") считается за "РЕЛИЗ" и добавляет карту-события в руку игрока.',
      active: '#game .bridge .zone',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    fieldZoneDouble: {
      pos: 'bottom-right',
      text: 'Если обе стороны зоны связаны с одно стороной другой зоны, то для корректного размещения на ней должен находиться дубль. То есть каждая из сторон данной зоны должна соответствовать значению присоединяемой.',
      active: '#game .plane .zone.double',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    cardActive: {
      pos: 'bottom-left',
      text: 'Это карты-событий, которые доступных для розыгрыша или уже были разыграны. Если нажать на иконку с восклицательным знаком на карте, то можно получить подсказку.',
      active: '[code="Deck[card_active]"]',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    leaveGame: {
      pos: 'top-left',
      text: 'Для выхода из игры необходимо нажать эту кнопку, либо выбрать соответствующий пункт в меню.',
      active: '.leave-game-btn',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
