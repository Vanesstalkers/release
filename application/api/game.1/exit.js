({
  access: 'public',
  method: async ({ }) => {

    domain.db.updateSubscriberRooms({ client: context.client, accessType: 'game' });

    return 'ok';
  },
});
