'use strict'
const Controller = require('egg').Controller
class UserController extends Controller {
  async create() {
    const { ctx } = this
    // 1. 数据校验
    const body = ctx.request.body
    ctx.validate({
      username: { type: 'string' },
      email: { type: 'email' },
      password: { type: 'string' }
    })
    const userService = this.service.user
    if (await userService.findByUsername(body.username)) {
      this.ctx.throw(422, '用户已存在')
    }
    if (await userService.findByEmail(body.email)) {
      this.ctx.throw(422, '邮箱已存在')
    }
    // 2. 保存用户
    const user = await userService.createUser(body)
    // 3. 生成token
    const token = userService.createToken({
      userId: user._id
    })
    ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
        token
      }
    }
  }

  async login() {
    // 1. 数据验证
    const { ctx } = this
    const body = ctx.request.body
    ctx.validate({
      email: { type: 'email' },
      password: { type: 'string' }
    }, body)
    const userService = this.service.user
    const user = await userService.findByEmail(body.email).select('+password')
    if (!user) {
      ctx.throw(422, '用户不存在')
    }
    if (this.ctx.helper.md5(body.password) !== user.password) {
      ctx.throw(422, '密码不正确')
    }
    // 2. 生成 token
    const token = userService.createToken({
      userId: user._id
    })
    // 3. 发送响应数据
    ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
        token
      }
    }
  }

  async getCurrentUser() {
    // 1. 验证token
    // 2. 获取用户
    // 3. 发送响应
    const user = this.ctx.user
    this.ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
        token: this.ctx.headers.authorization
      }
    }
  }

  async update() {
    // 1. 基本数据验证
    const { ctx } = this
    const body = ctx.request.body
    ctx.validate({
      email: { type: 'email', required: false },
      password: { type: 'string', required: false },
      username: { type: 'string', required: false },
      channelDescription: { type: 'string', required: false },
      avatar: { type: 'string', required: false }
    }, body)
    const userService = this.service.user
    // 2. 校验邮箱是否存在
    if (body.email) {
      if (body.email !== ctx.user.email && await userService.findByEmail(body.email)) {
        this.ctx.throw(422, 'email已存在')
      }
    }
    if (body.password) {
      body.password = ctx.helper.md5(body.password)
    }
    // 3. 校验用户是否存在
    if (body.username) {
      if (body.username !== ctx.user.username && await userService.findByUsername(body.username)) {
        this.ctx.throw(422, 'username已存在')
      }
    }
    // 4. 更新用户信息
    const user = await userService.updateUser(body)
    // 5. 返回更新之后的用户信息
    ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar
      }
    }
  }

  async subscribe() {
    const userId = this.ctx.user._id
    const channelId = this.ctx.params.userId
    // 1. 用户不能订阅自己
    if (userId.equals(channelId)) {
      this.ctx.throw(422, '用户不能订阅自己')
    }
    // 2. 添加订阅
    const user = await this.service.user.subscribe(userId, channelId)
    // 3. 发送响应
    this.ctx.body = {
      user: {
        ...this.ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'cover',
          'channelDescription',
          'subscribersCount'
        ]),
        isSubscribed: true
      }
    }
  }

  async unsubscribe() {
    const userId = this.ctx.user._id
    const channelId = this.ctx.params.userId
    // 1. 用户不能订阅自己
    if (userId.equals(channelId)) {
      this.ctx.throw(422, '用户不能订阅自己')
    }
    // 2. 取消订阅
    const user = await this.service.user.unsubscribe(userId, channelId)
    // 3. 发送响应
    this.ctx.body = {
      user: {
        ...this.ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'cover',
          'channelDescription',
          'subscribersCount'
        ]),
        isSubscribed: false
      }
    }
  }

  async getUser() {
    // 1. 获取订阅状态
    let isSubscribed = false
    if (this.ctx.user) {
      // 获取订阅记录
      const record = await this.app.model.Subscription.findOne({
        user: this.ctx.user._id,
        channel: this.ctx.params.userId
      })
      if (record) {
        isSubscribed = true
      }
    }
    // 2. 获取用户信息
    const user = await this.app.model.User.findById(this.ctx.params.userId)
    // 3. 发送响应
    this.ctx.body = {
      user: {
        ...this.ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'cover',
          'channelDescription',
          'subscribersCount'
        ]),
        isSubscribed
      }
    }
  }

  async getSubscriptions() {
    const Subscription = this.app.model.Subscription
    let subscription = await Subscription.find({
      user: this.ctx.params.userId
    }).populate('channel')
    subscription = subscription.map(item => (this.ctx.helper._.pick(item.channel, ['_id', 'username', 'avatar'])))
    this.ctx.body = {
      subscription
    }
  }
}

module.exports = UserController
