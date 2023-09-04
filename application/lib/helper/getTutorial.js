(formattedPath) => {
  const path = formattedPath.split('-');
  let realPath = ['lib', ...path];
  let obj = lib.utils.getDeep(this, realPath);
  if (!obj) {
    realPath = ['domain', ...path];
    obj = lib.utils.getDeep(this, realPath);
  }
  if (!obj?.steps) throw new Error('Tutorial not found');
  return obj.steps;
};
