# kcola

## 简介
`kcola` 一个基于`koa2`，小而美的`RESTful API` + `MVC`的Web开发框架！

支持`websocket`和多进程等特性

## 设计思想

* 约定大于配置
* 精简而优美
* 轻量可扩展
* 追求优雅实现

## 特性

* route与controller自动映射
* controller方法参数自动解析
* 支持多进程(LPC)
* 支持多层路由(web,Api,websocket)

## LPC 概念

LPC（本地进程间通信）是IPC（进程间通信）概念的延伸，它抽象出Node.js中多进程操作，使其以统一的方式展现给开发人员，从而对开发人员更加友好

## 中间件

kcola 会自动加载 `约定`目录（`/middleware`）下的自定义的Koa中间件，当然你也可以在应用中自己添加

## 运行环境

node version >=8.94

koa >=2.0


## 安装
```shell
npm i kcola -S
```

## API


## 如何使用

```js



```

## 更新日志 

**V1.0**
