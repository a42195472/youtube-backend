module.exports = app => {
  /**
   * @type {import 'mongoose'.Mongoose}
   */
  const mongoose = app.mongoose
  const Schema = mongoose.Schema
  const subscriptionSchema = new Schema({
    user: { type: mongoose.ObjectId, required: true, ref: 'User' },
    channel: { type: mongoose.ObjectId, required: true, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    test: {}
  })
  return mongoose.model('Subscription', subscriptionSchema)
}
