async (context, { action, step, tutorial: tutorialName, usedLink, isMobile }) => {
  const { userId } = context.session.state;
  const user = lib.store('user').get(userId);
  let { currentTutorial } = user;
  if (!currentTutorial) currentTutorial = {};

  if (tutorialName) {
    if (currentTutorial.active) throw new Error('Другое обучение уже активно в настоящий момент.');

    const tutorial = lib.helper.getTutorial(tutorialName);
    const helper = step
      ? Object.entries(tutorial).find(([key]) => key === step)[1]
      : Object.values(tutorial).find(({ initialStep }) => initialStep);
    if (!helper) throw new Error('Tutorial initial step not found');

    const { _prepare: prepareStep } = helper.actions || {};
    const nextStep = lib.utils.structuredClone(helper, { convertFuncToString: true });
    if (prepareStep) prepareStep(nextStep, { isMobile });
    user.set({ helper: nextStep });
    user.set({ currentTutorial: { active: tutorialName } });
    if (usedLink) {
      user.set({ helperLinks: { [usedLink]: { used: true } } });
      // !!! если запущена игра, то давать прибавку к таймеру
    }
  } else if (currentTutorial.active) {
    if (action === 'exit') {
      user.set({
        finishedTutorials: { [currentTutorial.active]: true },
        helper: null,
        currentTutorial: null,
      });
    } else {
      const tutorial = lib.helper.getTutorial(currentTutorial.active);
      const { _prepare: prepareStep } = tutorial[step].actions || {};
      const nextStep = lib.utils.structuredClone(tutorial[step], { convertFuncToString: true });
      if (prepareStep) prepareStep(nextStep, { isMobile });

      if (nextStep) {
        user.set({ helper: nextStep }, { reset: ['helper', 'helper.actions'] }); // reset обязателен, так как набор ключей в каждом helper-step может быть разный
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
