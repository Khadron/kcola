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
  historyMode: {
    rewrites: [],
    ignores: [],
  },
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

    const appConfigPath = validateConfigFile(config.appConfigPath, './app.json');
    let appConfig = defaultAppConfig;
    if (appConfigPath) {
      appConfig = require(appConfigPath);
    }

    handleMiddleware(config.middlewareOpts, app);

    const routeDir = validateConfigFile(config.routeDir, './routes');
    if (!routeDir) {
      throw new Error('[kcola error] "routes" directory not found, please create');
    }
    const ctrlDir = validateConfigFile(config.controllerDir, './controllers');
    if (!ctrlDir) {
      throw new Error('[kcola error] "controllers" directory not found, please create');
    }

    const ctrls = generateCtrlFiles(ctrlDir);
    const router = handleRoute(ctrls, {
      info: appConfig.route_meta_data || appConfig.app_routes,
      dir: routeDir,
    });
    app.use(router.routes()).use(router.allowedMethods());
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
    app.listen = function listen(...args) {
      server.listen.apply(server, args);
      return server;
    };

    if (appConfig.enable_websocket) {
      handleWebSocket(server, router.wsRouter);
    }

    if (appConfig.enable_spa_history_mode) {
      app.middleware.unshift(handleSpaMode(config.historyMode));
    }

    if (appConfig.enable_https) {
      const enforceHttps = require('koa-sslify');
      app.middleware.unshift(enforceHttps());
    }

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

  return existsSync(filepath) ? filepath : null;
}
