import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
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
