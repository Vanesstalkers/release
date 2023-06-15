({
  access: 'public',
  method: async ({ action, step, tutorial, usedLink }) => {
    try {
      const user = lib.store('user').get(context.userId);
      let { currentTutorial, helperLinks = {}, finishedTutorials = {} } = user;
      if (!currentTutorial) currentTutorial = {};

      if (tutorial) {
        if (currentTutorial.active) throw new Error('Другое обучение уже активно в настоящий момент.');
        if (!domain.game[tutorial]) throw new Error('Tutorial not found');
        if (usedLink && !step) step = usedLink;
        const helper = step
          ? Object.entries(domain.game[tutorial]).find(([key]) => key === step)[1]
          : Object.values(domain.game[tutorial]).find(({ initialStep }) => initialStep);
        if (!helper) throw new Error('Tutorial initial step not found');
        user.currentTutorial = { active: tutorial };

        user.helper = helper;
        if (usedLink) {
          user.helperLinks = { ...helperLinks, [usedLink]: { ...helperLinks[usedLink], used: true } };
        }
      } else if (currentTutorial.active) {
        if (action === 'exit') {
          user.finishedTutorials = { ...finishedTutorials, [currentTutorial.active]: true };
          user.helper = null;
          user.currentTutorial = null;
        } else {
          const nextStep = domain.game[currentTutorial.active][step];
          if (nextStep) {
            user.set('helper', nextStep);
            user.currentTutorial = { ...currentTutorial, step };
          } else {
            user.finishedTutorials = { ...finishedTutorials, [currentTutorial.active]: true };
            user.helper = null;
            user.currentTutorial = null;
          }
        }
      } else {
        user.helper = null;
      }

      await user.saveState();
      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
