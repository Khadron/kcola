const Communicator = require('./communicator');

module.exports = (name, handlerPath) => {
  const communicator = new Communicator(name, handlerPath);
  console.log('[LPC] initialization:', communicator.name);
  return communicator;
};
