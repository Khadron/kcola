const Koa = require('koa');
const onerror = require('koa-onerror');
const lib = require('./lib');
const isGeneratorFunction = require('is-generator-function');
const convert = require('koa-convert');

const defaultConfig = {
  publicDir: '', // 访问静态资源目录
  routeDir: '', // 存放route文件目录
  ctrlDir: '', // 存放controller文件目录
  appConfigPath: '', // 框架配置文件地址
  middlewareOpts: {}, // 中间件配置参数
};

const coreMiddlewarePosTable = {
  'koa-sslify': '0',
  'spa': '1',
  'koa-static': '2',
  'koa-body': '3',
  'koa-router': '-1',
  'koa-router-allowed-methods': '-2',
  'koa-json': '-3',
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
    this.mwCount = 0;
    this.mwPosTable = [];
    this.mwScope = {
      start: null,
      end: null,
    };
    config = Object.assign(defaultConfig, config);
    lib(config, this);
    onerror(this);
    this.use(require('koa-json')(), 'koa-json');
  }

  /**
   * 重写koa use方法
   * 保证中间件的顺序
   * @param {function} fn
   * @param {number} pos 指定中间件的位置
   * @return {Kcola}
   * @memberof Kcola
   */
  use(fn, pos) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
    if (isGeneratorFunction(fn)) {
      fn = convert(fn);
    }

    let mwname = '';
    // 处理内部核心中间件，减少外部修改参数的可能
    if (typeof pos === 'string') {
      mwname = pos;
      let cpos = coreMiddlewarePosTable[mwname];
      if (!cpos) {
        throw new Error('Invalid parameter: type check failed for parameter "pos". Expected Number');
      }
      cpos = parseInt(cpos, 10);
      // pos为undefined时插入到最后
      // 还有pos为负数的情况也需要放置到最后
      // 因为可以配置一些系统的中间件是可以跳过，故需要处理pos值进行重新赋值
      if (cpos < 0 || this.middleware.length < cpos + 1) {
        pos = this.middleware.length;
      } else {
        pos = cpos;
      }

      if (this.mwScope.start === null) {
        this.mwScope.start = pos;
      }

      // cpos < 0 表示找到最后一个节点标志
      if (cpos < 0 && this.mwScope.end === null) {
        this.mwScope.end = pos;
      }
    } else {
      // 非系统组件做索引转换，使调用无感知
      // 确定范围，在范围内增删
      const startIndex = this.mwScope.start || 0;
      const endIndex = this.mwScope.end || this.middleware.length;

      if (typeof pos === 'undefined') {
        pos = endIndex;
      }
      if (pos < startIndex) {
        pos = startIndex + pos;
      }
      if (pos > endIndex) {
        pos = endIndex - 1;
      }

      if (this.mwScope.end !== null) {
        this.mwScope.end++;
      }
    }

    this.middleware.splice(pos, 0, fn);
    fn['mwname'] = mwname || `mw-${pos}`;

    console.log('middleware record:', this.middleware.map((mw) => mw.mwname));
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
        this.use(m.fn(m.opts));
      }
    });
  }
}

module.exports = Kcola;
