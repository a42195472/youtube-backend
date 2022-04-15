const Controller = require('egg').Controller

class VideoController extends Controller {
  async createVideo() {
    const body = this.ctx.request.body
    const { Video } = this.ctx.model
    this.ctx.validate({
      title: { type: 'string' },
      description: { type: 'string' },
      vodVideoId: { type: 'string' },
      cover: { type: 'string' }
    }, body)
    body.user = this.ctx.user._id
    const video = await new Video(body).save()
    this.ctx.status = 201
    this.ctx.body = {
      video
    }
  }
  async getVideo() {
    const { Video, Subscription, Like } = this.ctx.model
    const { videoId } = this.ctx.params
    let video = await Video.findById(videoId).populate('user', '_id username avatar subscribersCount')
    if (!video) {
      this.ctx.throw(404, 'Video Not Found')
    }
    video = video.toJSON()
    video.isLiked = false // 是否喜欢
    video.isDisliked = false // 是否不喜欢
    video.user.isSubscribed = false // 是否已订阅视频作者
    if (this.ctx.user) {
      const userId = this.ctx.user._id
      if (await Like.findOne({ user: userId, video: videoId, like: 1 })) {
        video.isLiked = true
      }
      if (await Like.findOne({ user: userId, video: videoId, like: -1 })) {
        video.isDisliked = true
      }
      if (await Subscription.findOne({ user: userId, channel: video.user._id })) {
        video.user.isSubscribed = true
      }
    }
    this.ctx.body = {
      video
    }
  }
  async getVideos() {
    const { Video } = this.ctx.model
    let { pageSize = 10, pageNum = 1 } = this.ctx.query
    pageSize = Number.parseInt(pageSize)
    pageNum = Number.parseInt(pageNum)
    const getVideos = Video.find()
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
    const getVideosCount = Video.countDocuments()
    const [videos, videosCount] = await Promise.all([getVideos, getVideosCount])
    this.ctx.body = {
      videos,
      videosCount
    }
  }
  async getUserVideos() {
    const params = this.ctx.params
    this.ctx.validate({
      userId: { type: 'string' }
    }, params)
    const { Video } = this.ctx.model
    const { userId } = params
    let { pageSize = 10, pageNum = 1 } = this.ctx.query
    pageSize = Number.parseInt(pageSize)
    pageNum = Number.parseInt(pageNum)
    const getVideos = Video.find({ user: userId })
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
    const getVideosCount = Video.countDocuments({ user: userId })
    const [videos, videosCount] = await Promise.all([getVideos, getVideosCount])
    this.ctx.body = {
      videos,
      videosCount
    }
  }
  async getUserFeedVideos() {
    const { Video, Subscription } = this.ctx.model
    let { pageSize = 10, pageNum = 1 } = this.ctx.query
    pageSize = Number.parseInt(pageSize)
    pageNum = Number.parseInt(pageNum)
    const channels = await Subscription.find({ user: this.ctx.user._id }).populate('channel')
    const getVideos = Video.find({
      user: {
        $in: channels.map(item => item.channel._id)
      }
    })
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
    const getVideosCount = Video.countDocuments({
      user: {
        $in: channels.map(item => item.channel._id)
      }
    })
    const [videos, videosCount] = await Promise.all([getVideos, getVideosCount])
    this.ctx.body = {
      videos,
      videosCount
    }
  }
  async updateVideo() {
    const { body } = this.ctx.request
    const { Video } = this.ctx.model
    const { videoId } = this.ctx.params
    this.ctx.validate({
      title: { type: 'string', required: false },
      description: { type: 'string', required: false },
      vodVideoId: { type: 'string', required: false },
      cover: { type: 'string', required: false }
    }, body)
    // 查询视频
    const video = await Video.findById(videoId)
    if (!video) {
      this.ctx.throw(404, 'Video Not Found')
    }
    // 视频作者必须是当前登录用户
    if (!video.user.equals(this.ctx.user._id)) {
      this.ctx.throw(403)
    }
    // 更新
    Object.assign(video, this.ctx.helper._.pick(body, ['title', 'description', 'vodVideoId', 'cover']))

    // 把修改保存到数据库中
    await video.save()

    this.ctx.body = {
      video
    }
  }
  async deleteVideo() {
    const { videoId } = this.ctx.params
    const { Video } = this.ctx.model
    // 查询视频
    const video = await Video.findById(videoId)
    if (!video) {
      this.ctx.throw(404, 'Video Not Found')
    }
    // 视频作者必须是当前登录用户
    if (!video.user.equals(this.ctx.user._id)) {
      this.ctx.throw(403)
    }
    await video.remove()
    this.ctx.status = 204
  }
  async createComment() {
    const { body } = this.ctx
    const { Video, Comment } = this.ctx.model
    const { videoId } = this.ctx.params
    this.ctx.validate({
      content: { type: 'string' }
    }, body)

    const video = await Video.findById(videoId)
    if (!video) {
      this.ctx.throw(404)
    }
    const comment = await new Comment({
      content: body.content,
      user: this.ctx.user._id,
      video: videoId
    }).save()
    video.commentsCount = Comment.countDocuments({
      video: videoId
    })
    await video.save()
    await comment.populate('user').populate('video')
    this.ctx.body = {
      comment
    }
  }
  async getVideoComment() {
    const { videoId } = this.ctx.params
    let { pageSize = 10, pageNum = 1 } = this.ctx.query
    const { Comment } = this.ctx.model
    pageSize = Number.parseInt(pageSize)
    pageNum = Number.parseInt(pageNum)

    const getComments = Comment.find({ video: videoId }).skip((pageNum - 1) * pageSize).limit(pageSize)
      .populate('user')
      .populate('video')
    const getCommentsCount = Comment.countDocuments({ video: videoId })
    const [comments, commentsCount] = await Promise.all([getComments, getCommentsCount])
    this.ctx.body = {
      comments,
      commentsCount
    }
  }
  async deleteVideoComment() {
    const { Video, Comment } = this.ctx.model
    const { videoId, commentId } = this.ctx.params

    // 检测视频是否存在
    const video = await Video.findById(videoId)
    if (!video) {
      this.ctx.throw(404, 'Video Not Found')
    }

    // 检测评论是否存在
    const comment = await Comment.findById(commentId)
    if (!comment) {
      this.ctx.throw(404, 'Comment Not Found')
    }

    // 校验评论的作者是否未当前登录用户
    if (!comment.user.equals(this.ctx.user._id)) {
      this.ctx.throw(403)
    }

    await comment.remove()

    video.commentsCount = await Comment.countDocuments({
      video: videoId
    })
    await video.save()
    this.ctx.status = 204
  }
  async likeVideo() {
    const { Video, Like } = this.ctx.model
    const { videoId } = this.ctx.params
    const userId = this.ctx.user._id
    const video = await Video.findById(videoId)
    if (!video) {
      this.ctx.throw(404, 'Video Not Found')
    }
    const doc = await Like.findOne({
      user: userId,
      video: videoId
    })
    let isLiked = true
    if (doc && doc.like === 1) {
      await doc.remove()
      isLiked = false
    } else if (doc && doc.like === -1) {
      doc.like = 1
      await doc.save()
    } else {
      await new Like({
        user: userId,
        video: videoId,
        like: 1
      }).save()
    }
    // 更新喜欢视频的数量
    video.likesCount = await Like.countDocuments({
      video: videoId,
      like: 1
    })
    // 更新不喜欢视频的数量
    video.dislikesCount = await Like.countDocuments({
      video: videoId,
      like: -1
    })
    // 保存到数据库中
    await video.save()
    this.ctx.body = {
      video: {
        ...video.toJSON(),
        isLiked
      }
    }
  }
  async dislikeVideo() {
    const { Video, Like } = this.ctx.model
    const { videoId } = this.ctx.params
    const userId = this.ctx.user._id
    const video = await Video.findById(videoId)
    if (!video) {
      this.ctx.throw(404, 'Video Not Found')
    }
    const doc = await Like.findOne({
      user: userId,
      video: videoId
    })
    let isDisLiked = true
    if (doc && doc.like === -1) {
      await doc.remove()
      isDisLiked = false
    } else if (doc && doc.like === 1) {
      doc.like = -1
      await doc.save()
    } else {
      await new Like({
        user: userId,
        video: videoId,
        like: -1
      }).save()
    }
    // 更新喜欢视频的数量
    video.likesCount = await Like.countDocuments({
      video: videoId,
      like: 1
    })
    // 更新不喜欢视频的数量
    video.dislikesCount = await Like.countDocuments({
      video: videoId,
      like: -1
    })
    // 保存到数据库中
    await video.save()
    this.ctx.body = {
      video: {
        ...video.toJSON(),
        isDisLiked
      }
    }
  }
  async getUserLikedVideos() {
    const { Video, Like } = this.ctx.model
    let { pageNum = 1, pageSize = 10 } = this.ctx.query
    pageNum = Number.parseInt(pageNum)
    pageSize = Number.parseInt(pageSize)
    const filterDoc = {
      user: this.ctx.user._id,
      like: 1
    }
    const likes = await Like.find(filterDoc)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
    const getVideos = Video.find({
      _id: {
        $in: likes.map(item => item.video)
      }
    }).populate('user')
    const getVideosCount = Like.countDocuments(filterDoc)
    const [videos, videosCount] = await Promise.all([getVideos, getVideosCount])
    this.ctx.body = {
      videos,
      videosCount
    }
  }
}

module.exports = VideoController
