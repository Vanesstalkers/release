async (context, { id: channelUserId, name }) => {
  try {
    const { sessionId } = context.session.state;
    const session = lib.store('session').get(sessionId);
    const user = session.user();
    const userId = user.id();

    if (!user.name) throw new Error('Для открытия личного чата должно быть указано имя пользователя');

    user.set({ personalChatMap: { [channelUserId]: { name } } });
    await user.saveChanges();

    await lib.store.broadcaster.publishData(`user-${channelUserId}`, { personalChatMap: { [userId]: { name: user.name } } });

    return { status: 'ok' };
  } catch (err) {
    console.log(err);
    context.client.emit('session/error', { message: err.message, stack: err.stack });
    return err;
  }
};
