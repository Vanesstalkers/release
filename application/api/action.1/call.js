({
  // access: 'public',
  method: async ({ path, args = [] }) => {
    try {
      const splittedPath = path.split('.');
      if (!splittedPath.includes('api')) throw new Error(`Method (path="${path}") not found`);

      const method = lib.utils.getDeep(this, splittedPath);
      if (typeof method !== 'function') throw new Error(`Method (path="${path}") not found`);
      if (!Array.isArray(args)) args = [args || {}];
      const result = await method(context, ...args);
      result.serverTime = Date.now();
      return result;
    } catch (err) {
      console.log(err);
      context.client.emit('session/error', { message: err.message, stack: err.stack });
      return err;
    }
  },
});
