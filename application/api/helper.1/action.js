({
  access: 'public',
  method: async ({ action, step, tutorial, usedLink }) => {
    try {
      const userId = context.client.userId;
      const repoUser = lib.repository.user[userId];
      const { currentTutorial = {}, helperLinks = {}, finishedTutorials = {} } = repoUser;

      if (tutorial) {
        if (currentTutorial.active) throw new Error('Другое обучение уже активно в настоящий момент.');
        if (!domain.game[tutorial]) throw new Error('Tutorial not found');
        if(usedLink && !step) step = usedLink;
        const helper = step
          ? Object.entries(domain.game[tutorial]).find(([key]) => key === step)[1]
          : Object.values(domain.game[tutorial]).find(({ initialStep }) => initialStep);
        if (!helper) throw new Error('Tutorial initial step not found');
        repoUser.currentTutorial = { active: tutorial };

        repoUser.helper = helper;
        if (usedLink) {
          repoUser.helperLinks = { ...helperLinks, [usedLink]: { ...helperLinks[usedLink], used: true } };
        }
      } else if (currentTutorial.active) {
        if (action === 'exit') {
          repoUser.finishedTutorials = { ...finishedTutorials, [currentTutorial.active]: true };
          repoUser.helper = null;
          repoUser.currentTutorial = {};
        } else {
          const nextStep = domain.game[currentTutorial.active][step];
          if (nextStep) {
            repoUser.helper = nextStep;
            repoUser.currentTutorial = { ...currentTutorial, step };
          } else {
            repoUser.finishedTutorials = { ...finishedTutorials, [currentTutorial.active]: true };
            repoUser.helper = null;
            repoUser.currentTutorial = {};
          }
        }
      } else {
        repoUser.helper = null;
      }

      context.client.emit('db/smartUpdated', {
        user: { [userId]: { helper: repoUser.helper, helperLinks: repoUser.helperLinks } },
      });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
