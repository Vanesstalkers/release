async (context, { name }) => {
  const user = lib.store('user').get(context.userId);

  user.name = name;

  await user.saveState();
  return { status: 'ok' };
};
