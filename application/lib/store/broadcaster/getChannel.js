(name) => {
  const { channels } = lib.store.broadcaster;
  if (!channels.has(name)) channels.set(name, { instance: null, subscribers: new Map() });
  return channels.get(name);
};
