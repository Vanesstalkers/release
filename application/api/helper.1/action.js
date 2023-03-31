({
  access: 'public',
  method: async ({ action, step, tutorial }) => {
    try {
      const userId = context.client.userId;
      const repoUser = lib.repository.user[userId];
      const { currentTutorial = {} } = repoUser;

      if (tutorial) {
        if (currentTutorial.active) throw new Error('Another tutorial is active');
        if (!domain.game[tutorial]) throw new Error('Tutorial not found');
        repoUser.currentTutorial = { active: tutorial, step: 0 };
        const helper = Object.values(domain.game[tutorial]).find(({ initialStep }) => initialStep);
        lib.repository.user[userId].helper = helper;
      } else if (currentTutorial.active) {
        if (action === 'exit') {
          lib.repository.user[userId].helper = null;
          lib.repository.user[userId].currentTutorial = {};
        } else {
          const nextStep = domain.game[currentTutorial.active][step];
          if (nextStep) {
            lib.repository.user[userId].helper = nextStep;
            lib.repository.user[userId].currentTutorial = { ...currentTutorial, step };
          } else {
            lib.repository.user[userId].helper = null;
            lib.repository.user[userId].currentTutorial = {};
          }
        }
      } else {
        lib.repository.user[userId].helper = null;
      }

      context.client.emit('db/smartUpdated', { user: { [userId]: { helper: lib.repository.user[userId].helper } } });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
