import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [120, 'Name cannot be more than 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Please provide a product slug'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
    },
    tags: {
      type: [String],
      default: ['Organic'],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      enum: ['New', 'Sale', 'Bestseller', 'Featured', 'Hero', ''],
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    features: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockCount: {
      type: Number,
      default: 100,
    },
    isHero: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in development hot reloads
export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
