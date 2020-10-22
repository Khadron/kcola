/* eslint-disable no-unused-vars */
/* eslint-disable valid-jsdoc */
const path = require('path');
const fs = require('fs');

/**
 *
 *
 * @param {*} accept
 * @returns
 */
function isHtml(accept) {
  const htmlAccept = ['text/html', 'application/xhtml+xml', 'application/xml', '*/*'];
  const acceptArr = accept.replace(/;/g, ',').split(',');
  for (let i = 0; i < acceptArr.length; i++) {
    if (htmlAccept.indexOf(acceptArr[i]) > -1) {
      return true;
    }
  }
  return false;
}

/**
 *
 *
 * @param {*} func
 * @returns
 */
function parseArgs(func) {
  const args = func.toString().match(/[function\s|\w\s*].*?\(([^)]*)\)/)[1];
  return args
      .split(',')
      .map(function(arg) {
      // 去除注释和参数默认值
        const key = arg
            .replace(/\/\*.*\*\//, '')
            .replace(/(=\s*.*\s*)+/g, '')
            .trim();
        let value = arg.match(/=\s?(.*)\s?/);
        if (value && value.length > 1) {
          value = value[1].trim();
          if (/^\d+\.\d+$/.test(value)) {
          // 浮点数
            value = parseFloat(value);
          } else if (/^\d+$/.test(value)) {
          // 整数
            value = parseInt(value, 10);
          } else if (/^true|TRUE|True|false|FALSE|False/.test(value)) {
          // bool
            value = value.toLowerCase() === 'true';
          } else {
          // 字符串
            value = value.replace(/"/g, '').replace(/'/g, '').toString();
          }
        }
        return {
          key,
          value,
        };
      })
      .filter(function(args) {
        return args;
      });
}

/**
 *
 *
 * @param {*} req
 * @returns
 */
function getClientIp(req) {
  let ip =
    req.headers['x-forwarded-for'] ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    '';
  if (ip.split(',').length > 0) {
    ip = ip.split(',')[0];
  }
  ip = ip.substr(ip.lastIndexOf(':') + 1, ip.length);
  console.log('ip:' + ip);
  return ip;
}

/**
 *
 *
 * @param {*} date
 * @returns
 */
const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
};

/**
 *
 *
 * @param {*} n
 * @returns
 */
const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

/**
 *
 * 遍历目录
 * @param {*} dir
 * @param {*} result
 * @returns
 */
function traverseDir(dir, result) {
  result = result || [];
  if (path.isAbsolute(dir) === false) {
    dir = path.join(process.cwd(), dir);
  }
  const stat = fs.lstatSync(dir);
  if (stat.isDirectory()) {
    const filenames = fs.readdirSync(dir);
    filenames.forEach(function(cur, index, arr) {
      cur = path.join(dir, cur);
      traverseDir(cur, result);
    });
  } else {
    result.push(dir);
  }
  return result;
}
/**
 *
 * 加载模块（默认加载当前Node.js进程工作路径）
 * @param {*} modulePath
 * @param {*} rootPath
 */
function loadModule(modulePath, rootPath) {
  if (!path.isAbsolute(modulePath)) {
    modulePath = path.join(rootPath || process.cwd(), modulePath);
  }
  try {
    return require(modulePath);
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 *
 * 判断指定路径的文件或文件夹是否存在
 * @param {*} path
 * @returns
 */
function existsSync(path) {
  try {
    fs.accessSync(path);
  } catch (e) {
    return false;
  }

  return true;
}

/**
 *
 *
 * @param {*} type
 * @returns
 */
function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) === '[object ' + type + ']';
  };
}

const isObject = isType('Object');
const isString = isType('String');
const isArray = Array.isArray || isType('Array');
const isFunction = isType('Function');
const isUndefined = isType('Undefined');

module.exports = {
  isHtml,
  parseArgs,
  getClientIp,
  formatTime,
  formatNumber,
  traverseDir,
  loadModule,
  existsSync,
  isType,
  isObject,
  isString,
  isArray,
  isFunction,
  isUndefined,
};
