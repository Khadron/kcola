/* eslint-disable prefer-spread */
/* eslint-disable valid-jsdoc */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const EventEmitter = require('events').EventEmitter;
const handleRoute = require('./handleRoute');
const handleWebSocket = require('./handleWebSocket');
const handleSpaMode = require('./handleHistoryMode');
const handleMiddleware = require('./handleMiddleware');
const {traverseDir, existsSync} = require('../../utils');

const defaultAppConfig = {
  route_meta_data: [],
  enable_spa_history_mode: true,
  enable_load_middleware: false,
  enable_https: false,
  certificate: {
    certPath: null,
    keyPath: null,
  },
  enable_websocket: true,
  max_pool_size: 16,
};

/**
 *
 *
 * @class Kcola
 * @extends {EventEmitter}
 */
class App extends EventEmitter {
  /**
   *Creates an instance of App.
   * @param {*} config
   * @param {*} app
   * @memberof App
   */
  constructor(config, app) {
    super();

    const appConfigPath = validateConfigFile(config.appConfigPath, './appConfig.json');
    let appConfig = defaultAppConfig;
    if (appConfigPath) {
      appConfig = require(appConfigPath);
    }

    if (appConfig.enable_https) {
      const enforceHttps = require('koa-sslify');
      app.use(enforceHttps(), 'koa-sslify');
    }

    if (appConfig.enable_spa_history_mode) {
      app.use(handleSpaMode(config.historyMode), 'spa');
    }
    app.use(
        require('koa-static')(path.join(global.__kcola_workdir, config.publicDir || './public'), {defer: true}),
        'koa-static'
    );
    app.use(
        require('koa-body')({multipart: true, parsedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}),
        'koa-body'
    );

    if (appConfig.enable_load_middleware) {
      handleMiddleware(config.middlewareOpts, app, 4);
    }

    const routeDir = validateCoreDirectory(config.routeDir, './routes');
    if (!routeDir) {
      throw new Error('[kcola error] "routes" directory not found, please create');
    }
    const ctrlDir = validateCoreDirectory(config.controllerDir, './controllers');
    if (!ctrlDir) {
      throw new Error('[kcola error] "controllers" directory not found, please create');
    }

    const ctrls = generateCtrlFiles(ctrlDir);
    const router = handleRoute(ctrls, {
      info: appConfig.route_meta_data || appConfig.app_routes,
      dir: routeDir,
    });
    app.use(router.routes(), 'koa-router').use(router.allowedMethods(), 'koa-router-allowed-methods');
    app.routeMatcher = router.stack.map((value) => {
      return {
        regexp: value.regexp,
        path: value.path,
        ignoreauth: value.ignoreauth,
      };
    });

    let server = null;
    if (appConfig.enable_https) {
      server = https.createServer(
          {
            cert: fs.readFileSync(appConfig.certificate.certPath),
            key: fs.readFileSync(appConfig.certificate.keyPath),
          },
          app.callback()
      );
    } else {
      server = http.createServer(app.callback());
    }

    if (appConfig.enable_websocket) {
      handleWebSocket(server, router.wsRouter);
    }

    app.listen = function listen(...args) {
      server.listen.apply(server, args);
      return server;
    };

    app.server = server;
  }
}

module.exports = (config, app) => {
  return new App(config, app);
};

/**
 *
 * 生成 controller 对象
 * @param {*} ctrlRoot
 * @returns
 */
function generateCtrlFiles(ctrlRoot) {
  let ctrlFiles = [];
  try {
    ctrlFiles = traverseDir(ctrlRoot);
  } catch (error) {
    console.error(error);
  }
  return ctrlFiles;
}

/**
 *
 * 检验配置文件并返回其路径
 * @param {*} filepath
 * @param {*} defaultPath
 * @returns
 */
function validateConfigFile(filepath, defaultPath) {
  if (!filepath) {
    filepath = defaultPath;
  }

  if (!path.isAbsolute(filepath)) {
    filepath = path.join(global.__kcola_workdir, filepath);
  }

  const stat = fs.statSync(filepath);
  if (stat.isDirectory()) {
    filepath = path.join(filepath, './index.js');
  }

  return existsSync(filepath) ? filepath : null;
}

/**
 *
 *检验框架核心目录
 * @param {*} dir
 * @param {*} defaultDir
 * @returns
 */
function validateCoreDirectory(dir, defaultDir) {
  if (!dir) {
    dir = defaultDir;
  }

  if (!path.isAbsolute(dir)) {
    dir = path.join(global.__kcola_workdir, dir);
  }
  return existsSync(dir) ? dir : null;
}
