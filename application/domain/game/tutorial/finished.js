({
  steps: {
    win: {
      text: 'Поздравляю, вы победили.',
      buttons: [{ text: 'Круто!', action: 'exit' }],
    },
    lose: {
      text: 'К сожалению вы проиграли, но это не страшно - в следующий раз точно будет победа!',
      buttons: [{ text: 'Обязательно будет!', action: 'exit' }],
    },
    cancel: {
      text: 'Игра была отменена по причине выхода одного из игроков.',
      buttons: [{ text: 'Понятно, спасибо.', action: 'exit' }],
    },
  },
});
