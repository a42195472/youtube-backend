/* eslint valid-jsdoc: "off" */

'use strict'

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {}

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1649557909234_1288'

  // add your middleware config here
  config.middleware = ['errorHandler']

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  }
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1/youtube',
      options: {
        useUnifiedTopology: true
      },
      // mongoose global plugins, expected a function or an array of function and options
      plugins: []
    }
  }
  config.security = {
    csrf: {
      enable: false
    }
  }

  config.jwt = {
    secret: 'fe188c3d-a5f9-4b5f-9b30-c5e4f9f500a3',
    expiresIn: '15d'
  }
  config.cors = {
    origin: '*' // 允许跨域的网站地址
    // {string|Function} origin: '*',
    // {string|Array} allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  }

  return {
    ...config,
    ...userConfig
  }
}
