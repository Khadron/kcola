/* eslint-disable new-cap */
/* eslint-disable valid-jsdoc */

const path = require('path');
const fs = require('fs');
const Router = require('@koa/router');
const mainRouter = Router();
const handleRequest = require('./handleRequest');
/**
 *
 * 提取路由对象信息
 * @param {*} ctrFilePath
 * @param {*} cfgDir
 * @returns
 */
function extractRouteInfo(ctrFilePath, cfgDir) {
  const routeInfos = [];
  const ctrlObj = require(ctrFilePath);
  if (ctrlObj) {
    const key = path.basename(ctrFilePath, '.js');
    const cfgPath = `${cfgDir}/${key}.json`.replace(/\/\//gm, '');
    if (fs.existsSync(cfgPath)) {
      const curConfigs = require(cfgPath);
      const keys = Object.keys(curConfigs);
      keys.forEach((methodName) => {
        const cfg = curConfigs[methodName];
        routeInfos.push({
          name: key,
          url: formatRoute(cfg, key),
          method: cfg.method || 'get',
          own: cfg.own,
          controller: ctrlObj,
          action: methodName,
          ignoreauth: cfg.ignoreauth,
        });
      });
    } else {
      console.warn(`[warn]route config not found - ${cfgPath}`);
    }
  } else {
    console.warn(`[warn]controller info not found - ${ctrFilePath}`);
  }

  return routeInfos;
}
/**
 *
 * 格式化路由信息
 * @param {*} cfg
 * @param {*} defaultRoute
 * @returns
 */
function formatRoute(cfg, defaultRoute) {
  let url = `/${defaultRoute}/`;
  if (cfg.route) {
    url = cfg.route;
  } else {
    if (cfg.pathname) {
      // 默认把controller.js文件名作为路由的一部分
      url = `${safeUriFormat(url)}/${safeUriFormat(cfg.pathname)}`;
    }
  }
  return url;
}
/**
 *
 * 创建路由对象
 * @param {*} routes
 * @returns
 */
function createRouter(routes) {
  const router = {};
  routes.forEach((route) => {
    if (!route.namespace) {
      throw new Error('Found invalid "namespace" value, please check "appConfig.json" ');
    }
    if (!router[route.namespace]) {
      let pathname = route.namespace || '';
      if (route.prefix) {
        pathname += '/' + route.prefix.replace(/^\/*/, '');
      }
      if (route.version) {
        pathname += '/' + route.version;
      }
      pathname = safeUriFormat(pathname, 'all');
      if (route.upgrade) {
        router[route.namespace] = {
          name: route.namespace,
          upgrade: route.upgrade,
          opts: {
            prefix: pathname,
          },
        };
        Object.assign(route, {pathname});
      } else {
        router[route.namespace] = Router({
          name: route.namespace,
          prefix: pathname,
        });
      }
    }
  });
  return router;
}
/**
 *
 * 安全地格式化Uri
 * @param {string} uri
 * @param {string} formatType
 * @returns {string}
 */
function safeUriFormat(uri, formatType) {
  if (!uri) {
    return uri;
  }

  switch (formatType) {
    case 'head':
      return `/${uri.replace(/^\/|\/$/g, '')}`;
    case 'tail':
      return `${uri.replace(/^\/|\/$/g, '')}/`;
    case 'all':
      return `/${uri.replace(/^\/|\/$/g, '')}/`;
    default:
      return uri.replace(/^\/|\/$/g, '');
  }
}

module.exports = (ctrlFiles, config) => {
  try {
    let routeInfos = [];
    ctrlFiles.forEach(function(info) {
      if (path.extname(info) !== '.js') {
        return;
      }
      routeInfos = routeInfos.concat(extractRouteInfo(info, config.dir));
    });
    const routerSet = createRouter(config.info);
    console.log('=== route info: ===');
    const ignores = {};
    mainRouter.wsRouter = {};
    for (const routeInfo of routeInfos) {
      const own = routeInfo.own ? routeInfo.own.toLowerCase() : 'main';
      const method = routeInfo.method ? routeInfo.method.toLowerCase() : '';
      const curRouter = routerSet[own];
      console.log(
          '* ',
          'own ->',
          own || 'main',
          method,
          `${(curRouter && curRouter.opts.prefix) || ''}${routeInfo.url}`,
          'auth:',
        routeInfo.ignoreauth ? 'no' : 'yes'
      );
      if (curRouter) {
        if (curRouter.upgrade && curRouter.upgrade === 'ws') {
          const wsPath = safeUriFormat(curRouter.opts.prefix, 'all');
          if (!mainRouter.wsRouter[wsPath]) {
            mainRouter.wsRouter[wsPath] = {};
          }
          mainRouter.wsRouter[wsPath][routeInfo.action] = new routeInfo.controller()[routeInfo.action];
        } else {
          curRouter[method](routeInfo.action, routeInfo.url, handleRequest(routeInfo));
        }
      } else {
        mainRouter[method](routeInfo.action, routeInfo.url, handleRequest(routeInfo));
      }

      ignores[routeInfo.action] = {
        ignore: routeInfo.ignoreauth,
        method: routeInfo.method === 'del' ? 'delete' : routeInfo.method,
      };
    }
    console.log('===');

    Object.keys(routerSet).forEach((key) => {
      const curRouter = routerSet[key];
      if (!curRouter.upgrade) {
        mainRouter.use(curRouter.routes());
      }
    });

    mainRouter.stack.forEach((item) => {
      if (ignores[item.name]) {
        item.ignoreauth = ignores[item.name];
      }
    });
    return mainRouter;
  } catch (err) {
    console.error(`handleMapping error: ${err}`);
    throw err;
  }
};
