async (context, { text }) => {
  const { userId } = context;
  const user = lib.store('user').get(userId);
  lib.store.broadcaster.publishAction(`lobby-main`, 'updateChat', {
    text,
    user: {
      id: userId,
      name: user.name, // сохраняем user.name, потому что после перезапуска сервера в store может не быть нужного user
    },
  });
  return { status: 'ok' };
};
