({
  access: 'public',
  method: async ({ path, args = [] }) => {
    try {
      const splittedPath = path.split('.');
      if (!splittedPath.includes('api')) throw new Error(`Method (path="${path}") not found`);

      const { method, access } = lib.utils.getDeep(this, splittedPath);
      if (access !== 'public') throw new Error(`Method (path="${path}") not found`);
      if (typeof method !== 'function') throw new Error(`Method (path="${path}") not found`);
      if (!Array.isArray(args)) args = [args];
      return await method(context, ...args);
    } catch (err) {
      console.log(err);
      context.client.emit('session/error', { message: err.message, stack: err.stack });
      return err;
    }
  },
});
