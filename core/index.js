const path = require('path');
const Koa = require('koa');
const onerror = require('koa-onerror');
const lib = require('./lib');

const defaultConfig = {
  publicDir: '', // 访问静态资源目录
  routeDir: '', // 存放route文件目录
  ctrlDir: '', // 存放controller文件目录
  appConfigPath: '', // 框架配置文件地址
  middlewareOpts: {}, // 中间件配置参数
};

/**
 *
 *
 * @class Kcola
 * @extends {Koa}
 */
class Kcola extends Koa {
  /**
   *Creates an instance of Kcola.
   * @param {*} workDir 工程启动目录
   * @param {*} config
   * @memberof Kcola
   */
  constructor(workDir, config = {}) {
    global.__kcola_workdir = workDir;
    super();
    config = Object.assign(defaultConfig, config);
    this.use(require('koa-body')({multipart: true, parsedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}), true);
    this.use(
        require('koa-static')(path.join(global.__kcola_workdir, config.publicDir || './public'), {defer: true}),
        true
    );
    onerror(this);
    lib(config, this); // koa-router会影响 koa-static中间件功能，故放到最后
    this.use(require('koa-json')(), true);
  }

  /**
   *
   * 重写koa use方法
   * 保证中间件的顺序
   * @param {function} fn
   * @param {number} pos 指定中间件的位置
   * @return {Kcola}
   * @memberof Kcola
   */
  use(fn, pos) {
    if (!pos || this.middleware.length === 0 || this.middleware.length - 1 < pos) {
      super.use(fn);
    } else {
      this.middleware.splice(pos, 0, fn);
    }
    return this;
  }

  /**
   *
   * 加载中间件
   * @param { Object } middleware
   * @memberof Kcola
   */
  loadMiddleware(middleware) {
    const middlewares = [];
    if (!Array.isArray(middleware)) {
      middlewares.push(middleware);
    }

    middlewares.forEach((m, i) => {
      if (typeof m.fn === 'function') {
        this.use(m.opts);
      }
    });
  }
}

module.exports = Kcola;
