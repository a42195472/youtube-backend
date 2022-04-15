module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema
  const commentSchema = new Schema({
    content: { type: String, required: true },
    user: { type: mongoose.ObjectId, required: true, ref: 'User' },
    video: { type: mongoose.ObjectId, required: true, ref: 'Video' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })
  return mongoose.model('Comment', commentSchema)
}
