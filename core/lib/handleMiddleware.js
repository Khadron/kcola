const path = require('path');
const {traverseDir, existsSync} = require('../../utils');

module.exports = (opts, app, start) => {
  const filepath = path.join(global.__kcola_workdir, './middleware');
  if (existsSync(filepath)) {
    const filenames = traverseDir(filepath);
    const entryjs = filenames.filter((f) => f.lastIndexOf('index.js') > -1);
    const regex = /\\|\//gi;
    const ms = [];
    entryjs.forEach((e, i) => {
      const dirname = path.dirname(e);
      const mwname = dirname.substring(dirname.lastIndexOf(path.sep)).replace(regex, '');
      try {
        const {generateMiddleware, sequence} = require(e);
        const handler =generateMiddleware(opts[mwname]);
        ms.push({handler, sequence});
        console.log('middleware-', mwname);
      } catch (err) {
        const {generateMiddleware, sequence} = require(e);
        const again = generateMiddleware(opts[mwname]);
        ms.push({handler: again, sequence});
        console.log('middleware(again)-', mwname);
      }
    });
    ms.sort((a, b) => {
      if (a.sequence < b.sequence) {
        return -1;
      } else if (a.sequence > b.sequence) {
        return 1;
      } else {
        return 0;
      }
    });

    ms.forEach((mw, index)=>{
      if (typeof mw.handler === 'function') {
        app.use(mw.handler, index);
      }
    });
  }
};
