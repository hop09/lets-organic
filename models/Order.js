import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    slug: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: '', trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    customer: {
      type: CustomerSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      default: 'COD',
      trim: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });

export { ORDER_STATUSES };

// Prevent model overwrite in development hot reloads
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
