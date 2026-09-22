import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { getAdminFromRequest } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  siteName: 'Lets Organic',
  tagline: 'Pure Organic Living',
  logoText: 'Lets Organic',
  logoImageUrl: '',
  faviconUrl: '/favicon.svg',
  currency: 'PKR',
  heroBadge: 'Pure Organic Living',
  heroTitle: "Discover Nature's Best Kept Secrets",
  heroSubtitle: 'Shop curated organic skincare, superfoods, and wellness products — handpicked for a naturally beautiful, sustainable lifestyle.',
  heroProductId: '',
  announcements: [
    'Free Delivery Across Pakistan on Orders Over PKR 2,500',
    '100% Certified Pure Organic & Non-GMO',
    'Special Offer: Use code ORGANIC25 for 25% off',
    'Direct from Ethical Sustainable Organic Farms',
  ],
  contactEmail: 'admin@letsorganic.store',
  contactPhone: '+92 300 1234567',
  contactAddress: 'Lets Organic Hub, Lahore, Pakistan',
  shipping: {
    freeDelivery: false,
    deliveryFee: 250,
    freeDeliveryThreshold: 2500,
  },
  promotionBanner: {
    enabled: true,
    badge: 'Seasonal Harvest Offer',
    headline: 'Experience Nature at Its Purest — 25% Off',
    subheadline: 'Handcrafted organic serums, cold-pressed botanicals & pure superfoods. Limited time offer.',
    couponCode: 'ORGANIC25',
    buttonText: 'Claim 25% Off',
    buttonLink: '/shop',
    bgColor: '#5B7553',
    textColor: '#FFFFFF',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&fit=crop',
  },
};

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create(DEFAULT_SETTINGS);
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Return default settings on database error so site keeps running seamlessly
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      fallback: true,
    });
  }
}

export async function PUT(request) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const updateData = await request.json();

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ ...DEFAULT_SETTINGS, ...updateData });
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Store settings and branding updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update store settings' },
      { status: 500 }
    );
  }
}
