module.exports = () => {
  return async function Hello(ctx, next) {
    console.dir(ctx);
    console.log(`middleware：hello - ${ctx.url}`);
    await next();
  };
};
