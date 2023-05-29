({
  access: 'public',
  method: async () => {
    lib.repository.getCollection('lobby').get('main').leaveLobby({ token, userId });
    // lib.broadcaster.pubClient.publish(
    //   `lobby-main`,
    //   JSON.stringify({ eventName: 'leaveLobby', eventData: { token, userId } })
    // );
    return 'ok';
  },
});
