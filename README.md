# kcola

## 简介

`kcola` 一个基于`koa2`，小而美的`RESTful API` + `MVC`的 Web 开发框架！

支持`websocket`和多进程等特性

`kcola`设计的非常灵活，你除了直接使用[kcola-mvc](https://github.com/Khadron/kcola-mvc)项目外，也可以根据自身的应用场景实现属于自己的最佳实现

## 设计思想

- 约定大于配置
- 精简而优美
- 轻量可扩展
- 追求优雅实现

## 特性

- route 与 controller 自动映射
- controller 方法参数自动解析
- 支持多进程(LPC)
- 支持多层路由(web,Api,websocket)

## LPC 概念

LPC（本地进程间通信）是 IPC（进程间通信）概念的延伸，它抽象出 Node.js 中多进程操作，使其以统一的方式展现给开发人员，从而对开发人员更加友好

## 中间件

kcola 会自动加载 `约定`目录（`/middleware`）下的自定义的 Koa 中间件，当然你也可以在应用中自己添加
解决了中间件顺序不可控的难题，具体请查看 [.use(fn, pos)](#use)</a>

## 稳定版本

**v1.1.5**

## 运行环境

node version >=8.94

koa >=2.0

## 安装

```shell
npm i kcola -S
```

## 如何使用

### appConfig.json

`appConfig.json` 是框架级别的配置文件，指定框架基础设施功能

比如：是否启用 `websocket` 、设置 libuv 线程池中的线程数、启用单页面功能等配置

下面是配置项说明：

```js
{
  "route_meta_data":  // route_meta_data 路由的元数据配置
  [
        {
            "namespace": "monkey", // namespace 对路由系统级别的划分，比如现在这个路由属于 ‘monkey’子系统的
            "prefix": "api", // prefix 对路由功能级别的划分
            "version": "v1" // version 路由版本号控制
        },
        {
            "namespace": "elephant",
            "prefix": "cola",
            "upgrade": "ws"
        }
  ],
  "enable_spa_history_mode": false, // 是否启用‘单页面’模式，启用后所有的get请求都会返回 ‘index.html’内容，可以在‘config’中设置要忽略的请求，比如‘/api’前缀的请求
  "enable_websocket": true,
  "enable_load_middleware": true, // 是否启用自动加载中间件，开启时框架会自动扫描工程目录下的‘middleware’文件夹病加载对应的中间件，中间件的参数可在‘config’中用middlewareOpts来设置
  "max_pool_size": 16, // 设置libuv线程池中的线程数大小
  "enable_https": false, // 是否开启https请求，与‘certificate’一起使用
  "certificate": {
    "certPath": null, // 证书文件绝对路径
    "keyPath": null // 私钥文件绝对路径
  }
}
```

### config.js

`config.js` 是项目级别的配置文件，指定当前项目的一些行为配置

比如：指定搜索 `routeDir` 和 `controllerDir` 的目录、middlewareOpts 指定项目中要加载的中间件的参数信息等

在 kcola 类实例化时指定其路径

```js
const app = new App(__dirname, "config.js文件绝对路径");
```

关于`config.js`最佳实践请参考 [kcola-mvc](https://github.com/Khadron/kcola-mvc/tree/master/src/config) 项目

下面是配置项的说明：

```js

{
  historyMode: // 单页面模式下的配置，与 ‘enable_spa_history_mode’配合使用
  {
    rewrites: [], // url重写，默认全部重写到网站根目录
    ignores: [/^\/$/, /\/token/, /\/download\/*/, /\/exports\/*/], // 忽略要重写的路径
  },
  appConfigPath: "./appConfig.json", // 指定搜索‘appConfig.json’文件的路径
  routeDir: "./route_config", // 指定搜索‘router‘配置文件目录
  controllerDir: "./controller", // 指定搜索‘controller’文件目录
  middlewareOpts: {'koa-proxy':{url:''}}, // 指定项目中自定义的中间件所使用的参数，key为中间件目录的名称，如‘middleware’文件夹中的‘koa-proxy’文件或‘koa-proxy’文件夹
};
```

### 配置 router

`kcola`约定 router 配置文件为`json`格式的文件，放到`routeDir`指定的目录中

配置文件中对象的`key`为`controller`类中的方法名称（这里称为 action），`value`为路由的描述信息

下面是 router 配置项的说明

```js
{
  "action name": {
    "route": "/", // 路由 eg:/api/token
    //"pathname":"" // 也是指定路由，与‘route’不用的是pathname会在路由中自动添加上controller文件的name。eg:/api/home/token
    "method": "get", // 请求的方法类型
    "own": "monkey", // 指定该路由属于哪个子系统的，与‘appConfig.json’文件中‘route_meta_data’对象的‘namespace’的值对应
    "ignoreauth": true // 是否跳过系统安全校验
  }
}
```

### Kcola 类

`Kcola` 是框架的启动的入口类，也是最为核心的一个类， `Kcola`实例化后会生成一个 http/https/websocket 服务器

它有两个参数：

`workDir`：工程启动目录，一般都是项目启动文件（index.js）所在目录

`config`: config.js 所在路径

```js
const Kcola = require("kcola");
const app = new Kcola(__dirname, config);
app.listen(9527, function (err) {
  if (err) {
    console.dir(err);
    return;
  }
  console.log(`===========Listening at localhost:${port}==============`);
  console.log(`http://localhost:${port}/`);
  console.log("===========");
});
```

### .use(fn, pos)

`koa`中的 <a id="use" href="#">use</a> 方法无法指定中间点调用的顺序，由于中间的的调用`next()`方法位置及时机不同会产生不同的影响，因此 kcola 重写了`use`方法，多了一个`pos`参数用来指定中间件执行的位置

```js

app.use(function mw3(){},3);
app.use(function mw1{},1); // mw1会在mw3前执行
```

### 更多

更多的用法，请参考`kcola`最佳实践[kcola-mvc](https://github.com/Khadron/kcola-mvc)

## 更新日志

**v1.1.6** : update REAMDME
**v1.1.5** : **[milestone]** 第一个稳定版本
