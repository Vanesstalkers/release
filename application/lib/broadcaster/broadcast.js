({ room: roomName, data }) => {
  const { getRoom } = lib.broadcaster;
  const room = getRoom(roomName);
  for (const client of room.clients) {
    const broadcastData = data;
    // !!! тут могут быть кастомные данные для конкретных userId
    client.emit('db/smartUpdated', broadcastData);
  }
};
