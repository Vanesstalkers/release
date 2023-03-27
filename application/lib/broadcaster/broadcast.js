({ room: roomName, data }) => {
  const { getRoom } = lib.broadcaster;
  const room = getRoom(roomName);
  for (const client of room) {
    const broadcastData = data;
    console.log("client.emit('db/smartUpdated", data);
    // !!! тут могут быть кастомные данные для конкретных userId
    client.emit('db/smartUpdated', broadcastData);
  }
};
