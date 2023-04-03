({
  hello: {
    initialStep: true,
    text: 'Приветствую на портале обучающих настольных игр для бизнеса. Я могу провести небольшую экскурсию по сайту.',
    buttons: [
      { text: 'Продолжай', step: 'games' },
      { text: 'Я разберусь', action: 'exit' },
    ],
  },
  games: {
    text: 'Тут список игр',
    active: '.menu-item.list',
    buttons: [{ text: 'Дальше', step: 'rates' }],
  },
  rates: {
    text: 'Тут рейтинги',
    active: '.menu-item.top',
    buttons: [{ text: 'Дальше', step: 'chat' }],
  },
  chat: {
    text: 'Тут чат',
    active: '.menu-item.chat',
    buttons: [{ text: 'Дальше', step: 'playground' }],
  },
  playground: {
    text: 'Тут играют в игры',
    active: '.menu-item.game',
    buttons: [{ text: 'Дальше', step: 'exit' }],
  },
  exit: {
    text: 'В любой момент времени вы можете снова ко мне обратиться, нажав на мою иконку в правом нижнем углу экрана.',
    buttons: [{ text: 'Понятно', action: 'exit' }],
  },
});
