(roomOwner) => {
  const { rooms } = lib.broadcaster;
  const roomName = [roomOwner.col, roomOwner._id].join('-');
  if (!rooms.has(roomName)) rooms.set(roomName, new Set());
  return rooms.get(roomName);
};
