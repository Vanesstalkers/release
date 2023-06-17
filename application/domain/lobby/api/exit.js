async () => {
  const {
    client: { userId },
  } = context;
  lib.store.broadcaster.publishAction(`lobby-main`, 'leaveLobby', { id: userId });
  return { status: 'ok' };
};
