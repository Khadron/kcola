/* eslint-disable no-unused-vars */

const url = require('url');
const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;
const {getClientIp} = require('../utils');

const eventEmitter = new EventEmitter();

module.exports = (server, router) => {
  console.log('* enable websocket server');
  const wssDic = new Map();
  Object.keys(router).forEach((key) => {
    wssDic[key] = createWSServer(router[key]);
  });

  server.on('upgrade', (request, socket, head) => {
    // todo 权限校验， 这儿 or 中间件？

    const namespace = parseControllerName(`/${request.url.replace(/^\/|\/$/g, '')}/`);
    const wss = wssDic[namespace];
    if (wss) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
};

/**
 *
 *通过url解析出Controller名称
 * @param {string} urlStr
 * @return {string} controllername
 */
function parseControllerName(urlStr) {
  if (!urlStr) {
    return '';
  }
  const {pathname} = url.parse(urlStr);
  return pathname;
}

/**
 * 创建Websocket服务
 * 并初始化controller的动作
 * @param {*} actions
 * @return {WebSocket.Server}
 */
function createWSServer(actions) {
  const wss = new WebSocket.Server({noServer: true}); // 创建完全与HTTP服务器分离的Websocket服务器
  wss.on('connection', (ws, request) => {
    const ip = getClientIp(request);
    console.log('[kcola websocket server] 连接成功-', ip, request);

    ws.on('message', (packet) => {
      console.log('[kcola websocket server] packet:', packet);
      let packetObj = null;
      try {
        packetObj = JSON.parse(packet);
      } catch (error) {
        console.log(error);
        return;
      }
      if (!packetObj || !packetObj.action) {
        // message 格式校验
        return;
      }

      //   console.log(wss.url);

      const action = actions[packetObj.action];
      if (action) {
        const result = action.apply(ws, [wss.clients, packetObj.data]);
        if (result && result instanceof Promise) {
          result.then(function(data) {
            if (data) {
              ws.send(JSON.stringify(data), () => {
                console.log('发送完成');
              });
            }
          });
        } else {
          ws.send(JSON.stringify(result), () => {
            console.log('发送完成');
          });
        }
      }
    });
  });
  return wss;
}
