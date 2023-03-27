({ context: { client, userId }, room: roomName, everywere }) => {
  const { subscribers } = lib.broadcaster;
  let subscriber = subscribers.get(userId);
  if (everywere) {
    const { rooms } = subscriber;
    for (const room of rooms) room.delete(client);
    subscribers.delete(userId);
  } else {
    const room = getRoom(roomName);
    room.delete(client);
    subscriber.rooms.delete(room);
  }
};
