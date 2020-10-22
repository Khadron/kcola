/**
 * Controller Demo
 *
 * @class HomeController
 */
class HomeController {
  /**
   * hello world
   * @param {*} name
   * @memberof HomeController
   */
  async hello(name) {
    this.ctx.type = 'text/html; charset=utf-8';
    this.ctx.body = `<!DOCTYPE html>
    <html>
    <head></head>
    <body><h1>Hello KCola</h1><h2>${name}</h2>
    </body>
    </html>`;
  }

  /**
   * 向客户端发送消息
   *
   * @param {*} clients
   * @param {*} data
   * @memberof HomeController
   */
  async chat(clients, data) {
    console.log('<<< Client message:', data);
    setInterval(() => {
      this.send(new Date().toString());
    }, 1000);
  }

  /**
   * 接收客户端消息
   *
   * @param {*} clients
   * @param {*} data
   * @memberof HomeController
   */
  async receive(clients, data) {
    console.log('>>> Client send:', data);
  }

  /**
   * 测试命名空间
   *
   * @memberof HomeController
   */
  async testNamespace() {
    this.ctx.type = 'text/html; charset=utf-8';
    this.ctx.body =
      '<!DOCTYPE html><html><head></head><body><h1>Hello KCola</h1><h2>route namespace</h2></body></html>';
  }
}

module.exports = HomeController;
