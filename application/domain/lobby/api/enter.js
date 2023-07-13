async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);

  await user.enterLobby({ sessionId });

  // lobby.api.enter вызывается при каждом открытии страницы - без логики с connectedToLobby будут дублироваться вызовы с subscribe/unsubscribe и leaveLobby
  const lobbyName = `lobby-main`;
  if (!session.connectedToLobby) session.connectedToLobby = {};
  if (!session.connectedToLobby[lobbyName]) {
    session.connectedToLobby[lobbyName] = true;

    session.subscribe(lobbyName);
    context.client.events.close.push(() => {
      session.unsubscribe(lobbyName);
      user.leaveLobby({ sessionId });
    });
  }

  return { status: 'ok' };
};
