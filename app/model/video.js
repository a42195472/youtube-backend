module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema
  const VideoSchema = new Schema({
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    playUrl: {
      type: String
      // required: true
    },
    cover: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.ObjectId,
      required: true,
      ref: 'User'
    },
    vodVideoId: {
      type: String,
      required: true
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    dislikesCount: {
      type: Number,
      default: 0
    },
    likesCount: {
      type: Number,
      default: 0
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })
  return mongoose.model('Video', VideoSchema)
}
