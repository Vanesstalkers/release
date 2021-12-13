({
  access: 'public',
  method: async ({ }) => {

    domain.db.updateSubscriberRooms({ client: context.client, accessType: 'lobby' });
    //domain.lobby.unsubscribe({ client: context.client });

    return 'ok';
  },
});
