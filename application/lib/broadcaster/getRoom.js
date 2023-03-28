(name) => {
  const { rooms } = lib.broadcaster;
  if (!rooms.has(name)) rooms.set(name, { instance: null, clients: new Set() });
  return rooms.get(name);
};
