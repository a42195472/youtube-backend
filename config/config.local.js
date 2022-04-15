/**
 * @description 只针对本地开发有效果
 */
const secret = require('./secret')
exports.vod = {
  ...secret.vod
}
