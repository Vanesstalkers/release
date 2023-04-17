({ room: roomName, data, secureData = {} }) => {
  const existData = data !== null && Object.keys(data).length > 0;
  const existSecureData = Object.keys(secureData).length > 0;
  if (!(existData || existSecureData)) return;
  const { getRoom } = lib.broadcaster;
  const room = getRoom(roomName);
  for (const client of room.clients) {
    if (existData) client.emit('db/smartUpdated', data);
    if (existSecureData && secureData[client.userId]) client.emit('db/smartUpdated', secureData[client.userId]);
  }
};
