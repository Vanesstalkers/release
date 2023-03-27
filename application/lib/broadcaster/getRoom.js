(name) => {
  const { rooms } = lib.broadcaster;
  if (!rooms.has(name)) rooms.set(name, new Set());
  return rooms.get(name);
};
