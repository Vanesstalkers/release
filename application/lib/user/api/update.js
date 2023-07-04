async (context, { name }) => {
  const user = lib.store('user').get(context.userId);

  user.set({ name });

  await user.saveChanges();
  return { status: 'ok' };
};
