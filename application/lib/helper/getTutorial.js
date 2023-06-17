(tutorialPath) => {
  tutorialPath = tutorialPath.split('.');
  let tutorialObj = lib.utils.getDeep(this, ['lib', ...tutorialPath]);
  if (!tutorialObj) tutorialObj = lib.utils.getDeep(this, ['domain', ...tutorialPath]);
  if (!tutorialObj) throw new Error('Tutorial not found');
  return tutorialObj;
};
