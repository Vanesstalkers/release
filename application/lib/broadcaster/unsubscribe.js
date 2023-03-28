({ client, room: roomName }) => {
  const { subscribers } = lib.broadcaster;
  const userId = client.userId;
  let subscriber = subscribers.get(userId);
  const room = getRoom(roomName);
  // могла быть удалена
  if (room) {
    room.clients.delete(client);
    subscriber.rooms.delete(room);
  }
};
