
module.exports = (opts) => {
  return async function handleReponse(ctx, next) {
    try {
      if (ctx.request.header['accept'].indexOf('application/json') > -1) {
        const data = await next();
        if (data instanceof Error) {
          ctx.body = typeof opts.errorResult === 'function' ? opts.errorResult(data) : data.message || data;
          ctx.status = 500;
        } else {
          ctx.body = typeof opts.successResult === 'function' ? opts.successResult(data) : data;
          ctx.status = 200;
        }
      } else {
        await next();
      }
    } catch (error) {
      // 这里统一响应数据
      ctx.body = typeof opts.errorResult === 'function' ? opts.errorResult(error) : error.message || 'Server Error';
      ctx.status = 500;
    }
  };
};
