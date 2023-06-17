({
  // access: 'public',
  method: async ({ path, args = [] }) => {
    try {
      const splittedPath = path.split('.');
      if (!splittedPath.includes('api')) throw new Error(`Method (path="${path}") not found`);

      const method = lib.utils.getDeep(this, splittedPath);
      if (typeof method !== 'function') throw new Error(`Method (path="${path}") not found`);
      if (!Array.isArray(args)) args = [args];
      return await method(context, ...args);
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
