({ context: { client, userId }, room: roomOwner }) => {
  const { getRoom } = lib.broadcaster;
  const room = getRoom(roomOwner);
  room.add(client);
};
