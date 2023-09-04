async (context, { login, password, name, gender, info, avatarCode, lobbyPinnedItems }) => {
  const { userId } = context.session.state;
  const user = lib.store('user').get(userId);

  const setData = {};
  const cacheData = {};
  if (login !== undefined) {
    const dbData = await db.mongo.findOne('user', { login });
    if (dbData !== null) throw new Error('Данный логин не может быть установлен');
    setData.login = login;
    cacheData.login = setData.login;
  }
  if (password !== undefined) {
    setData.password = await metarhia.metautil.hashPassword(password);
    cacheData.password = setData.password;
  }
  if (name !== undefined) setData.name = name;
  if (gender !== undefined) setData.gender = gender;
  if (info !== undefined) setData.info = info;
  if (avatarCode !== undefined) setData.avatarCode = avatarCode;
  if (lobbyPinnedItems !== undefined) setData.lobbyPinnedItems = lobbyPinnedItems;

  if (Object.keys(setData).length) {
    user.set(setData);
    await user.saveChanges();
    await user.updateUserCache(cacheData);
  }
  return { status: 'ok' };
};
