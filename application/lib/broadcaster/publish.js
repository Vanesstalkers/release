async ({ room: roomOwner, data }) => {
  const { pubClient } = lib.broadcaster;
  const roomName = [roomOwner.col, roomOwner._id].join('-');
  pubClient.publish('updateData', JSON.stringify({ roomName, data })).catch((err) => {
    throw err;
  });
};
