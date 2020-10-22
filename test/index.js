const {describe, it, before} = require('mocha');
const {expect} = require('chai');
// const sinon = require('sinon');

const lpcTest = require('./lpc-test.js');
let handler = null;
describe('LPC test', function() {
  before(() => {
    handler = lpcTest.loadHandler('./test/lpc-test.js');
  });

  describe('Call handler method', function() {
    describe('Call a function with no parameters and no return value：', function() {
      it('No errors in execution', function() {
        expect(handler.callFn()).to.be.undefined;
      });
    });
    describe('Call a function with parameters and return values', function() {
      it('Output parameters and return values', function(done) {
        handler.callFnWithArgsAndRetVal('拉面', (err, ret) => {
          console.log(ret);
          expect(ret).to.be.a('string');
          done();
        });
      });
    });
    describe('Call a function that returns “Promise”', function() {
      it('Output the promise return value ', function(done) {
        handler.callPromiseFn((err, ret) => {
          console.log(ret);
          expect(ret).to.be.a('string');
          done();
        });
      });
    });
  });
});
