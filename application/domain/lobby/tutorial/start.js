({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: 'Приветствую на портале обучающих настольных игр для бизнеса. Я могу провести небольшую экскурсию по сайту.',
      buttons: [
        { text: 'Продолжай', step: 'fullscreen' },
        { text: 'Я разберусь', step: 'exit', exit: true },
      ],
    },
    fullscreen: {
      superPos: true,
      actions: {
        before: (self) => {
          const { isMobile } = self.state;
          let skipStep = true;
          if (isMobile) skipStep = false;
          return { skipStep };
        },
      },
      text: 'В левом верхнем углу кнопка, которая включает режим полного экрана. Повторное нажатие на нее отключит этот режим.',
      active: '.fullscreen-btn',
      buttons: [{ text: 'Продолжай', step: 'games' }],
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
      pos: 'top-right',
      text: 'В этом блоке можно присоединиться к игре, либо начать новую. Сейчас доступны варианты игры на 1,2 и 3 игроков.',
      active: '.menu-item.game',
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      superPos: true,
      actions: {
        _prepare: (step, { isMobile }) => {
          const replaceText = isMobile ? 'правом верхнем' : 'левом нижнем';
          step.text = step.text.replace('[[menu-position]]', replaceText);
        },
      },
      text: 'Ну и если что, то в [[menu-position]] углу будет расположена моя иконка, которая открывает меню, через которое в любой момент можно получить доступ к своему профилю, а также повторно запустить обучение.',
      buttons: [{ text: 'Понятно', action: 'exit' }],
    },
  },
});
