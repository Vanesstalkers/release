({
  steps: {
    hello: {
      initialStep: true,
      text: 'Поздравляю, вы начали однопользовательскую партию в игру "Релиз". Я готов рассказать об интерфейсе игры.',
      buttons: [
        { text: 'Продолжай', step: 'deckDice' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    deckDice: {
      text: 'Это счетчик оставшихся в колоде костяшек.',
      active: { selector: '[code="Deck[domino]"]', customClass: 'rounded' },
      buttons: [{ text: 'Дальше', step: 'deckCard' }],
    },
    deckCard: {
      text: 'Это счетчик оставшихся в колоде карт событий.',
      active: { selector: '[code="Deck[card]"]', customClass: 'rounded' },
      buttons: [{ text: 'Дальше', step: 'deckCardDrop' }],
    },
    deckCardDrop: {
      text: 'Это счетчик карт в колоде сброса.',
      active: { selector: '[code="Deck[card_drop]"]', customClass: 'rounded' },
      buttons: [{ text: 'Спасибо', step: 'exit' }],
    },
    exit: {
      text: 'В любой момент времени вы можете снова повторить это обучение. Для этого нужно нажать на мою иконку и выбрать пункт "Покажи доступные обучения". В открывшемся списке выберите интересующие вас подсказки.',
      buttons: [{ text: 'Понятно', action: 'exit' }],
    },
  },
});
