const mime = require('../../utils/mime');
const {isHtml} = require('../../utils');
const logger = console.log;

const defaultConfig = {
  rewrites: [{from: /(\/[^\/\.]+\/?)$/, to: '/'}],
  ignores: [/^\/$/],
};

module.exports = (config) => {
  return async function intercept(ctx, next) {
    const header = ctx.req.headers;
    const pathname = ctx.path;
    if (
      ctx.method !== 'GET' ||
      !header ||
      typeof header.accept !== 'string' ||
      header.accept.indexOf(mime.json) > -1 ||
      !isHtml(header.accept) ||
      pathname.lastIndexOf('.') > pathname.lastIndexOf('/')
    ) {
      return next();
    }

    config = config ? Object.assign(defaultConfig, config) : defaultConfig;
    let rewriteValue = '/index.html';
    for (let i = 0, il = config.ignores.length; i < il; i++) {
      const ignore = config.ignores[i];
      if (pathname.match(ignore)) {
        logger('Ignore Path', ctx.method, ctx.url, 'to', rewriteValue);
        return next();
      }
    }
    for (let i = 0; i < config.rewrites.length; i++) {
      const rewrite = config.rewrites[i];
      const match = pathname.match(rewrite.from);
      if (match !== null) {
        const to = rewrite.to;
        if (typeof to === 'string') {
          rewriteValue = to;
        } else if (typeof to === 'function') {
          rewriteValue = to(ctx.req, match);
        }
        break;
      }
    }
    logger('Rewriting', ctx.method, ctx.url, 'to', rewriteValue);
    ctx.url = rewriteValue;
    return next();
  };
};
