({
  steps: {
    hello: {
      initialStep: true,
      text: `Для каждой игровой колоды свой список рейтингов (в данный момент доступна только игра "Релиз").`,
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $item = $rootEl.querySelector('.menu-item.chat.pinned');
          if (!$item) $rootEl.querySelector('.menu-item.chat > label')?.click();
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'username' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    username: {
      text: 'Для того, чтобы писать в чате, необходимо указать свое имя.',
      active: '.menu-item.chat .chat-controls-alert',
      actions: {
        before: (self) => {
          const $inputNameForm = self.$root.$el.querySelector('.menu-item.chat .chat-controls-alert');
          const skipStep = $inputNameForm ? false : true;
          return { skipStep };
        },
      },
      pos: {
        desktop: 'bottom-right',
        mobile: 'top-right',
      },
      buttons: [{ text: 'Продолжай', step: 'channels' }],
    },
    channels: {
      text: 'В разделе "Игроки онлайн" отображается список всех пользователей, находящихся в настоящий момент на портале. Чтобы написать личное сообщение пользователю, то нужно нажать на его имя в этом блоке.',
      active: '.menu-item.chat .chat-header',
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      text: 'Получить доступ ко всем ранее открытым чатами можно с помощью отдельного переключателя.',
      active: '.menu-item.chat .chat-channels',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
