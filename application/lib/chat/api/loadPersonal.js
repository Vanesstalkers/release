async (context, { channelUserId }) => {
  try {
    const { sessionId } = context;
    const session = lib.store('session').get(sessionId);
    const user = session.user();
    const userId = user.id();
    if (!session.chatLoaded) session.chatLoaded = {}; // без .set(...), потому что в БД сохранять не обязательно

    const broadcastData = {};
    if (!session.chatLoaded[channelUserId]) { // сессия была создана позже
      session.chatLoaded[channelUserId] = Date.now();

      const msgList = await db.mongo.find(
        'chat',
        { parents: { $all: [userId, channelUserId] }, text: { $ne: null } },
        { sort: [['_id', -1]] } // загружаем все сообщения
      );
      broadcastData.items = {};
      for (const msg of msgList) broadcastData.items[msg._id] = msg;
    }
    broadcastData.lastView = Date.now();

    user.broadcastToSessions({
      type: 'db/smartUpdated',
      data: { user: { [userId]: { personalChatMap: { [channelUserId]: broadcastData } } } },
    });

    return { status: 'ok' };
  } catch (err) {
    console.log(err);
    return { status: 'err', message: err.message, hideMessage: err.stack };
  }
};
