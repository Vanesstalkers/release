({ client, room: roomName }) => {
  const { getRoom, subscribers } = lib.broadcaster;
  const userId = client.userId;
  const room = getRoom(roomName);
  room.clients.add(client);
  let subscriber = subscribers.get(userId);
  if (!subscriber) {
    subscriber = { client, rooms: new Set() };
    subscribers.set(userId, subscriber);
  }
  subscriber.rooms.add(room);

  client.on('close', () => {
    subscribers.delete(userId);
    // могла быть удалена
    if (room) {
      room.clients.delete(client);
      subscriber.rooms.delete(room);
    }
  });
};
