'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  const auth = app.middleware.auth()
  router.prefix('/api/v1') // 设置基础路径

  router.post('/users', controller.user.create)
  router.post('/users/login', controller.user.login)
  router.get('/user', auth, controller.user.getCurrentUser)
  router.patch('/user', auth, controller.user.update)
  router.get('/users/:userId', app.middleware.auth({ required: false }), controller.user.getUser)

  // 用户订阅
  router.post('/users/:userId/subscribe', auth, controller.user.subscribe)
  router.delete('/users/:userId/subscribe', auth, controller.user.unsubscribe)
  router.get('/users/:userId/subscriptions', controller.user.getSubscriptions)

  // 阿里云VOD
  router
    .get('/vod/CreateUploadVideo', auth, controller.vod.createUploadVideo)
    .get('/vod/RefreshUploadVideo', auth, controller.vod.refreshUploadVideo)
    .post('/videos', auth, controller.video.createVideo)
    .get('/videos/:videoId', app.middleware.auth({ required: false }), controller.video.getVideo)
    .get('/videos', controller.video.getVideos)
    .get('/users/:userId/videos', controller.video.getUserVideos)
    .get('/user/videos/feed', auth, controller.video.getUserFeedVideos)
    .patch('videos/:videoId', auth, controller.video.updateVideo)
    .delete('videos/:videoId', auth, controller.video.deleteVideo)
    .post('videos/:videoId/comments', auth, controller.video.createComment)
    .get('videos/:videoId/comments', controller.video.getVideoComment)
    .delete('/videos/:videoId/comments/:commentId', auth, controller.video.deleteVideoComment)
    .post('/videos/:video/like', auth, controller.video.likeVideo)
    .post('/videos/:video/dislike', auth, controller.video.dislikeVideo)
    .get('/videos/liked', auth, controller.video.getUserLikedVideos)
}
