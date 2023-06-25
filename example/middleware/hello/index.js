exports.generateMiddleware = (opts) => {
  return async function Hello(ctx, next) {
    console.log(`middleware：hello - ${ctx.url}`);
    await next();
  };
};
exports.sequence = 2;
