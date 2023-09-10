({
  steps: {
    hello: {
      initialStep: true,
      text: `Для каждой игровой колоды свой список рейтингов (в данный момент доступна только игра "Релиз").`,
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $item = $rootEl.querySelector('.menu-item.top.pinned');
          if (!$item) $rootEl.querySelector('.menu-item.top > label')?.click();
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'list' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    list: {
      text: 'Каждый рейтинг оценивает игроков по своим характеристикам. Например это может быть наибольшее количество игр и полученный доход, или наиболее качественное (без костылей) и быстрое решение задач.',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $item = $rootEl.querySelector('.menu-item-content .menu-game-item ul');
          if (!$item) $rootEl.querySelector('.menu-item-content .menu-game-item .toggle-game')?.click();
        },
      },
      buttons: [{ text: 'Продолжай', step: 'rating' }],
    },
    rating: {
      text: 'В таблице каждого рейтинга, помимо 5 лучших результатов, всегда отображается ваш результат - он выделяется по цвету среди все остальных строк.',
      active: 'tr.iam',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $item = $rootEl.querySelector('.menu-item-content .rankings .title');
          if (!$item) $rootEl.querySelector('.menu-item-content .menu-game-item .toggle-ranking')?.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      text: 'Для возврата к списку рейтингов необходимо нажать на заголовок таблицы.',
      active: '.menu-item-content .rankings .title > span',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
