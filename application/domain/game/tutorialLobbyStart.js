({
  hello: {
    initialStep: true,
    text: 'Приветствую на портале обучающих настольных игр для бизнеса. Я могу провести небольшую экскурсию по сайту.',
    buttons: [
      { text: 'Продолжай', step: 'games' },
      { text: 'Я разберусь', step: 'exit', exit: true },
    ],
  },
  games: {
    pos: 'bottom-left',
    text: 'Это список всех игр на сайте. Нажмите на интересующую вас, чтобы скачать правила.',
    active: '.menu-item.list',
    buttons: [{ text: 'Дальше', step: 'rates' }],
  },
  rates: {
    text: 'Тут будут рейтинги всех игроков.',
    active: '.menu-item.top',
    buttons: [{ text: 'Дальше', step: 'chat' }],
  },
  chat: {
    text: 'В чате можно общаться с игроками, которые сейчас на сайте. Для начала общения необходимо указать свои имя.',
    active: '.menu-item.chat',
    buttons: [{ text: 'Дальше', step: 'playground' }],
  },
  playground: {
    text: 'В этом блоке можно присоединиться к игре, либо начать новую. Сейчас доступны варианты игры на 1,2 и 3 игроков.',
    active: '.menu-item.game',
    buttons: [{ text: 'Дальше', step: 'exit' }],
  },
  exit: {
    text: 'В любой момент времени вы можете снова ко мне обратиться, нажав на мою иконку.',
    buttons: [{ text: 'Понятно', action: 'exit' }],
  },
});
