(roomName) => {
  const { rooms } = lib.broadcaster;
  if (!rooms.has(roomName)) rooms.set(roomName, new Set());
  return rooms.get(roomName);
};
