import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    badge: { type: String, default: '' },
    tagline: { type: String, default: '' },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const SiteSettingsSchema = new mongoose.Schema(
  {
    categories: {
      type: [CategorySchema],
      default: [
        {
          id: 'skincare',
          slug: 'skincare',
          name: 'Skincare',
          image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=700&fit=crop',
          count: 6,
          badge: '6 Formulas',
          tagline: 'Nourish & Glow',
        },
        {
          id: 'superfoods',
          slug: 'superfoods',
          name: 'Superfoods',
          image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600&h=700&fit=crop',
          count: 4,
          badge: 'Super Harvest',
          tagline: 'Pure Energy',
        },
        {
          id: 'wellness',
          slug: 'wellness',
          name: 'Wellness',
          image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=700&fit=crop',
          count: 4,
          badge: 'Daily Ritual',
          tagline: 'Mind & Body',
        },
        {
          id: 'home',
          slug: 'home',
          name: 'Home & Living',
          image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=700&fit=crop',
          count: 3,
          badge: 'Eco Living',
          tagline: 'Clean Living',
        },
        {
          id: 'haircare',
          slug: 'haircare',
          name: 'Hair Care',
          image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=700&fit=crop',
          count: 3,
          badge: 'Botanical',
          tagline: 'Deep Moisture',
        },
        {
          id: 'essentials',
          slug: 'essentials',
          name: 'Essential Oils',
          image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=700&fit=crop',
          count: 4,
          badge: 'Pure Extracts',
          tagline: '100% Organic',
        },
      ],
    },
    siteName: {
      type: String,
      default: 'Lets Organic',
    },
    tagline: {
      type: String,
      default: 'Pure Organic Living',
    },
    logoText: {
      type: String,
      default: 'Lets Organic',
    },
    logoImageUrl: {
      type: String,
      default: '',
    },
    faviconUrl: {
      type: String,
      default: '/favicon.svg',
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    heroBadge: {
      type: String,
      default: 'Pure Organic Living',
    },
    heroTitle: {
      type: String,
      default: "Discover Nature's Best Kept Secrets",
    },
    heroSubtitle: {
      type: String,
      default: 'Shop curated organic skincare, superfoods, and wellness products — handpicked for a naturally beautiful, sustainable lifestyle.',
    },
    heroProductId: {
      type: String,
      default: '',
    },
    announcements: {
      type: [String],
      default: [
        'Free Delivery Across Pakistan on Orders Over PKR 2,500',
        '100% Certified Pure Organic & Non-GMO',
        'Special Offer: Use code ORGANIC25 for 25% Off',
        'Direct From Ethical Sustainable Organic Farms',
      ],
    },
    contactEmail: {
      type: String,
      default: 'admin@letsorganic.store',
    },
    contactPhone: {
      type: String,
      default: '+92 300 1234567',
    },
    contactAddress: {
      type: String,
      default: 'Lets Organic Hub, Lahore, Pakistan',
    },
    shipping: {
      freeDelivery: {
        type: Boolean,
        default: false, // Option to enable 100% free delivery or paid delivery
      },
      deliveryFee: {
        type: Number,
        default: 250, // Standard delivery fee in PKR
      },
      freeDeliveryThreshold: {
        type: Number,
        default: 2500, // Free delivery if order total >= PKR 2500
      },
    },
    promotionBanner: {
      enabled: {
        type: Boolean,
        default: true,
      },
      badge: {
        type: String,
        default: 'Seasonal Harvest Offer',
      },
      headline: {
        type: String,
        default: 'Experience Nature at Its Purest — 25% Off',
      },
      subheadline: {
        type: String,
        default: 'Handcrafted organic serums, cold-pressed botanicals & pure superfoods. Limited time offer.',
      },
      couponCode: {
        type: String,
        default: 'ORGANIC25',
      },
      buttonText: {
        type: String,
        default: 'Claim 25% Off Now',
      },
      buttonLink: {
        type: String,
        default: '/shop',
      },
      bgColor: {
        type: String,
        default: '#5B7553',
      },
      textColor: {
        type: String,
        default: '#FFFFFF',
      },
      imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&fit=crop',
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
