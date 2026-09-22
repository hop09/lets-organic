import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    productSlug: {
      type: String,
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, 'Please provide your email'],
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please select a star rating'],
      min: 1,
      max: 5,
      default: 5,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Please provide feedback comments'],
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
