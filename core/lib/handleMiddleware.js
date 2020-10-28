const path = require('path');
const {traverseDir, existsSync} = require('../../utils');

module.exports = (opts, app) => {
  const filepath = path.join(global.__kcola_workdir, './middleware');
  if (existsSync(filepath)) {
    const filenames = traverseDir(filepath);
    const entryjs = filenames.filter((f) => f.lastIndexOf('index.js') > -1);
    const regex = new RegExp(path.sep, 'gi');
    entryjs.forEach((e) => {
      const dirname = path.dirname(e);
      const mwname = dirname.substring(dirname.lastIndexOf(path.sep)).replace(regex, '');
      console.log(mwname);
      app.use(require(e)(opts[mwname]));
    });
  }
};
