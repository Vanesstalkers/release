({ context: { client, userId }, room: roomName }) => {
  const { getRoom } = lib.broadcaster;
  const room = getRoom(roomName);
  room.add(client);
};
