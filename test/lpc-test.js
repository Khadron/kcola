const lpc = require('../core/lpc');

let handler = null;
module.exports = {
  loadHandler(path) {
    handler = lpc('小强', path);
    return handler;
  },
  callFn() {
    // 调用无参无返回值函数
    console.log('hello kcola !!!');
  },
  callFnWithArgs(fruit) {
    // 调用有参无返回值函数
    console.log(`${fruit} are so delicious!!!`);
  },
  callFnWithRetVal() {
    // 调用有返回值的函数
    return 'Good night';
  },
  callFnWithArgsAndRetVal(name) {
    return `The ${name} is very good!!!`;
  },
  callPromiseFn() {
    // 调用返回Promise的函数
    return Promise.resolve('hahaha~');
  },
};
