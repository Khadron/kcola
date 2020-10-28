const path = require('path');
const lpc = require('../../../lpc');
module.exports = () => {
  const handler = lpc('Alerm', path.join(__dirname, './alert.js'));
  return async function Alerm(ctx, next) {
    handler.sound((err, data) => {
      console.log('=== 已触发警报===', data);
    });
    next();
  };
};
