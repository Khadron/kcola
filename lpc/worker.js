const {loadModule} = require('../utils');

const args = process.argv.slice(-1);
const name = `${args[0]}-worker`;
const handlerPath = args[args.length - 1];

console.log('[LPC] handler path:', handlerPath);

const handler = loadModule(handlerPath); // 引入处理模块

process.on('message', function(data) {
  const ret = {
    id: data.id,
    data: null,
    action: 'exec',
    error: null,
  };

  const method = data.method;
  if (handler[method]) {
    try {
      const result = handler[method](...data.args);
      if (result) {
        if (result instanceof Promise) {
          return result
              .then((data) => {
                ret.data = data;
                process.send(ret);
              })
              .catch((err) => {
                ret.error = err.message || err;
                process.send(ret);
              });
        } else {
          ret.data = result;
        }
      }
    } catch (err) {
      ret.error = `${name} error: ${err.message || err}`;
      ret.action = 'error';
    }
  }
  process.send(ret);
});

process.on('uncaughtException', (err) => {
  console.error(`[LPC] ${name} unknown exception: `, err);
  process.exit(1);
});
