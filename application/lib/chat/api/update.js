async (context, { text, channel }) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  lib.store.broadcaster.publishAction(channel, 'updateChat', {
    text,
    // сохраняем user.name, потому что после перезапуска сервера в store может не быть нужного user
    user: { id: user.id(), name: user.name },
  });
  return { status: 'ok' };
};
