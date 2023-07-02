async (context, { action, step, tutorial: tutorialName, usedLink }) => {
  const user = lib.store('user').get(context.userId);
  let { currentTutorial, helperLinks = {}, finishedTutorials = {} } = user;
  if (!currentTutorial) currentTutorial = {};

  if (tutorialName) {
    if (currentTutorial.active) throw new Error('Другое обучение уже активно в настоящий момент.');

    const tutorial = lib.helper.getTutorial(tutorialName);
    if (usedLink && !step) step = usedLink;
    const helper = step
      ? Object.entries(tutorial).find(([key]) => key === step)[1]
      : Object.values(tutorial).find(({ initialStep }) => initialStep);
    if (!helper) throw new Error('Tutorial initial step not found');
    user.currentTutorial = { active: tutorialName };

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
      const tutorial = lib.helper.getTutorial(currentTutorial.active);
      const nextStep = tutorial[step];
      if (nextStep) {
        user.updateState('helper', nextStep);
        // user.helper = nextStep;
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
};
