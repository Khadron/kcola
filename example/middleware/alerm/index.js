const path = require('path');
const lpc = require('../../../lpc');
exports.generateMiddleware = (opts) => {
  const handler = lpc('Alerm', path.join(__dirname, './alert.js'));
  let counter = 0;
  return async function Alerm(ctx, next) {
    if (counter > 10) {
      handler.disconnect();
      await next();
      return;
    }
    console.log('=== 开始触发警报===');
    handler.sound((err, data) => {
      console.log('=== 已触发警报===', data);
    });
    counter++;
    await next();
  };
};
exports.sequence = 1;
