async (context) => {
  const { userId } = context.session.state;
  const user = lib.store('user').get(userId);

  user.set({ gameId: null, playerId: null });
  await user.saveChanges();

  user.logout();

  return { status: 'ok' };
};
