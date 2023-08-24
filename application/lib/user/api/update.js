async (context, { name }) => {
  const { userId } = context.session.state;
  const user = lib.store('user').get(userId);

  user.set({ name });

  await user.saveChanges();
  return { status: 'ok' };
};
