const path = require('path');
const lpc = require('../../../lpc');
module.exports = () => {
  const handler = lpc('Alerm', path.join(__dirname, './alert.js'));
  let counter = 0;
  return async function Alerm(ctx, next) {
    if (counter > 10) {
      handler.disconnect();
      return;
    }
    handler.sound((err, data) => {
      console.log('=== 已触发警报===', data);
    });
    counter++;
    next();
  };
};
