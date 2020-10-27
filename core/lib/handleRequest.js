const {isObject, parseArgs} = require('../utils');
const mime = require('../utils/mime');

module.exports = (route) => {
  const Controller = route.controller;
  const ctrl = isObject(Controller) ? Controller : new Controller();
  const action = ctrl[route.action];
  return async (ctx, next) => {
    if (Reflect.has(ctrl, 'ctx')) {
      ctrl.ctx = ctx;
    } else {
      Reflect.defineProperty(ctrl, 'ctx', {
        value: ctx,
        writable: true,
      });
    }
    if (Reflect.has(ctrl, 'next')) {
      ctrl.next = next;
    } else {
      Reflect.defineProperty(ctrl, 'next', {
        value: next,
        writable: true,
      });
    }
    if (!action) {
      console.log(`\n\rNot found ${route.name}-${route.action} method`);
      return next();
    }
    const args = parseArgs(action);
    const reqBody = ctx.request.body;
    const params = [];
    const fileObjs = [];
    let fields = null;
    if (reqBody) {
      if (ctx.is(mime.formData) || ctx.is(mime.stream)) {
        fields = reqBody.fields;
        const files = reqBody.files; // 处理文件上传参数
        for (const name in files) {
          if (!Object.prototype.hasOwnProperty.call(files, name)) {
            continue;
          }
          const file = files[name];
          fileObjs.push({
            path: file.path,
            name: file.name,
            type: file.type,
          });
        }
      }
    }

    args.forEach((a, index) => {
      const key = a.key;
      if (ctx.query[key]) {
        params.push(ctx.query[key]);
      } else if (key === 'files') {
        params.push(fileObjs);
      } else if (fields && fields[key]) {
        params.push(fields[key]);
      } else if (reqBody && reqBody[key]) {
        params.push(reqBody[key]);
      } else {
        params.push(a.value);
      }
    });
    if (params.length === 0) {
      params.push(reqBody || ctx.query);
    }
    try {
      // eslint-disable-next-line prefer-spread
      const result = ctrl[route.action].apply(ctrl, params);
      if (result) {
        if (result instanceof Promise) {
          const data = await result;
          if (data) {
            ctx.body = data;
          }
        } else {
          ctx.body = result;
        }
      } else {
        next();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        ctx.throw(500, error.message, error);
      } else {
        console.error(error);
        await ctx.render('error', {
          title: 'Exception',
          code: '500',
          message: ' An exception occurred in the application',
        });
      }
    }
  };
};
