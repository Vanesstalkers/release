({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: `Приветствую на портале обучающих настольных бизнес-игр.\r\nЯ могу провести для вас короткую экскурсию.`,
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
      pos: {
        desktop: 'bottom-left',
        mobile: 'bottom-right',
      },
      text: 'В разделе "Правила игр" список всех игр на сайте. Можно скачать правила в pdf-формате, а также посмотреть все карты каждой колоды.',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          $rootEl.querySelector('.menu-item.list > label')?.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'rates' }],
    },
    rates: {
      pos: {
        desktop: 'bottom-left',
        mobile: 'bottom-right',
      },
      text: 'В разделе "Зал славы" рейтинги достижений всех игроков. Вы также найдете там и статистику по своим играм.',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          $rootEl.querySelector('.menu-item.list > label')?.click();
          $rootEl.querySelector('.menu-item.top > label')?.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'chat' }],
    },
    chat: {
      pos: {
        desktop: 'bottom-right',
        mobile: 'bottom-right',
      },
      text: 'В чате можно общаться с игроками, которые сейчас на портале. В том числе можно написать кому-то личное сообщение.',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          $rootEl.querySelector('.menu-item.top > label')?.click();
          $rootEl.querySelector('.menu-item.chat > label')?.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'playground' }],
    },
    playground: {
      pos: {
        desktop: 'bottom-right',
        mobile: 'bottom-right',
      },
      text: '"Игровая комната" предназначена для поиска подходящей игры, если вы желаете присоединиться к кому либо, либо начать новую партию.',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          $rootEl.querySelector('.menu-item.chat > label')?.click();
          $rootEl.querySelector('.menu-item.game > label')?.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      superPos: true,
      actions: {
        _prepare: (step, { isMobile }) => {
          const replaceText = 'левом нижнем';
          step.text = step.text.replace('[[menu-position]]', replaceText);
        },
        profile: (self) => {
          self.showProfile();
        },
      },
      text: 'В [[menu-position]] углу будет расположена моя иконка, которая открывает меню. Через него можно в любой момент получить доступ к своему профилю или повторно запустить обучение.\r\nРекомендую сразу заполнить профиль, установив свой личный логин, пароль и выбрав аватар для игры.',
      buttons: [
        { text: 'Перейти в профиль', icon: ['fas', 'user'], action: 'profile' },
        { text: 'Понятно', action: 'exit' },
      ],
    },
  },
});
