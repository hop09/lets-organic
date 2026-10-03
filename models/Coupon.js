import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a coupon code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['percent', 'flat'],
      required: [true, 'Please specify the coupon type (percent or flat)'],
    },
    value: {
      type: Number,
      required: [true, 'Please provide a discount value'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrder: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order cannot be negative'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Defensive: guarantee uppercase + trimmed codes even if a document is
// constructed outside the API (the schema's `uppercase`/`trim` options
// already handle normal saves; this hook is a backstop).
CouponSchema.pre('save', function (next) {
  if (this.code) {
    this.code = String(this.code).trim().toUpperCase();
  }
  next();
});

// Prevent model overwrite in development hot reloads
export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
