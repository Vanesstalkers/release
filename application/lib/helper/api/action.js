async (context, { action, step, tutorial: tutorialName, usedLink }) => {
  const { userId } = context.session.state;
  const user = lib.store('user').get(userId);
  let { currentTutorial } = user;
  if (!currentTutorial) currentTutorial = {};

  if (tutorialName) {
    if (currentTutorial.active) throw new Error('Другое обучение уже активно в настоящий момент.');

    const tutorial = lib.helper.getTutorial(tutorialName);
    if (usedLink && !step) step = usedLink;
    const helper = step
      ? Object.entries(tutorial).find(([key]) => key === step)[1]
      : Object.values(tutorial).find(({ initialStep }) => initialStep);
    if (!helper) throw new Error('Tutorial initial step not found');

    user.set({ currentTutorial: { active: tutorialName } });
    user.set({ helper });
    if (usedLink) user.set({ helperLinks: { [usedLink]: { used: true } } });
  } else if (currentTutorial.active) {
    if (action === 'exit') {
      user.set({
        finishedTutorials: { [currentTutorial.active]: true },
        helper: null,
        currentTutorial: null,
      });
    } else {
      const tutorial = lib.helper.getTutorial(currentTutorial.active);
      const nextStep = tutorial[step];
      if (nextStep) {
        user.set({ helper: nextStep }, { reset: ['helper'] }); // reset обязателен, так как набор ключей в каждом helper-step может быть разный
        user.set({ currentTutorial: { step } });
      } else {
        user.set({
          finishedTutorials: { [currentTutorial.active]: true },
          helper: null,
          currentTutorial: null,
        });
      }
    }
  } else {
    user.set({ helper: null });
  }

  await user.saveChanges();
  return { status: 'ok' };
};
