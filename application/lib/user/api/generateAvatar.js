async (context, {} = {}) => {
  const { userId, sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { lobbyId } = session;
  const user = lib.store('user').get(userId);

  lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'userGenerateAvatar', {
    userId,
    userGender: user.gender,
    userInfo: user.info,
    currentUserAvatarCode: user.avatarCode,
    newDefaultAvatars: user.avatars,
  });

  return { status: 'ok' };
};
