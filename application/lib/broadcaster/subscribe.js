({ context: { client, userId }, room: roomName }) => {
  const { getRoom, subscribers } = lib.broadcaster;
  const room = getRoom(roomName);
  room.add(client);
  let subscriber = subscribers.get(userId);
  if (!subscriber) {
    subscriber = { client, rooms: new Set() };
    subscribers.set(userId, subscriber);
  }
  subscriber.rooms.add(room);
};
