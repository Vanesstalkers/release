async () => {
  const {
    client: { userId },
  } = context;
  lib.store.broadcaster.publishAction(`lobby-main`, 'userLeave', { id: userId });
  return { status: 'ok' };
};
