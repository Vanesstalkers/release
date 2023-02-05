const fsp = require('fs').promises;
(async () => {
  const files = await fsp.readdir('application/domain/game', { withFileTypes: true });
  console.log({ files });
})();
