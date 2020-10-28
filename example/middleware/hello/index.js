module.exports = () => {
  return async function Hello(ctx, next) {
    console.log(`middleware：hello - ${ctx.url}`);
    await next();
  };
};
