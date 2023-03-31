({ room: roomName, data, secureData = {} }) => {
  const { getRoom } = lib.broadcaster;
  const room = getRoom(roomName);
  for (const client of room.clients) {
    client.emit('db/smartUpdated', data);
    if (secureData[client.userId]) client.emit('db/smartUpdated', secureData[client.userId]);
  }
};
