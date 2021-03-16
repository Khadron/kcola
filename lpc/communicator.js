const path = require('path');
const EventEmitter = require('events').EventEmitter;
const {fork} = require('child_process');
const {loadModule} = require('../utils');
let handlerSet = new Map();
let counter = 1; // id计数器

/**
 *
 * Communicator 用来连接handler和子进程
 * @class Communicator
 * @extends {EventEmitter}
 */
class Communicator extends EventEmitter {
  /**
   *Creates an instance of Communicator.
   * @param {*} name
   * @param {*} handlerPath
   * @memberof Communicator
   */
  constructor(name, handlerPath) {
    super();
    this.run(handlerPath, name);
  }
  /**
   *关闭IPC通道
   *
   * @memberof Communicator
   */
  disconnect() {
    if (this.worker) {
      this.worker.disconnect();
      this.worker = null;
    }
  }
  /**
   * 执行worker
   *
   * @param {*} handlerPath
   * @param {*} name
   * @return {undefined}
   * @memberof Communicator
   */
  run(handlerPath, name) {
    if (!handlerPath) throw new Error('\n\r[LPC] 缺少 handlerPath 参数');

    if (typeof handlerPath !== 'string') throw new Error('\n\r[LPC] 参数 handlerPath 必须为 string 类型');

    const _this = this;
    _this.name = `LPC-${name}` || 'LPC-kcola'; // 业务处理器名称

    try {
      const handler = loadModule(handlerPath, global.__kcola_workdir);
      if (!handler) {
        return this.emit('error', `[LPC] init error:  Cannot find module ${handlerPath}`);
      }
      _this.worker = fork(path.join(__dirname, './worker'), [name, handlerPath], {
        silent: true,
      }); // 工作进程

      Object.keys(handler).forEach((key) => {
        if (typeof handler[key] === 'function') {
          _this[key] = function(...args) {
            const id = `LPC-${_this.name}-${counter}`;
            counter++;
            handlerSet[id] = args[args.length - 1]; // 处理完成后回调函数

            const message = {
              id,
              key: `${_this.name}->${key}`,
              method: key,
              args,
              action: 'call',
            };
            _this.worker.send(message, (err, data) => {
              if (err) console.error(err);
            });
          };
        }
      });

      _this.worker
          .on('message', (content) => {
            if (!content) return;

            if (typeof handlerSet[content.id] === 'function') {
              if (content.error) {
                handlerSet[content.id](new Error(content.error));
              } else {
                handlerSet[content.id](null, content.data);
              }
            }
          })
          .on('exit', () => {
            console.log(`LPC-${_this.name} Exit`);
            counter = null;
            handlerSet = null;
            this.worker = null;
            this.emit('exit');
          })
          .on('uncaughtException', (err) => {
            counter = null;
            handlerSet = null;
            this.worker = null;
            this.emit('error', `[LPC] uncaught error:`, err);
          });
    } catch (err) {
      this.emit('error', `[LPC] init error: ${err}`);
    }
  }
}

module.exports = Communicator;
