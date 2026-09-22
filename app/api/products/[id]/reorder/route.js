import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import { getAdminFromRequest } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const { images, videos } = await request.json();

    if (!Array.isArray(images)) {
      return NextResponse.json({ error: 'images must be an array' }, { status: 400 });
    }

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    } else {
      query = { slug: id };
    }

    const updatePayload = { images };
    if (Array.isArray(videos)) {
      updatePayload.videos = videos;
    }

    const updated = await Product.findOneAndUpdate(query, updatePayload, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Carousel media reordered successfully',
      images: updated.images,
      videos: updated.videos,
    });
  } catch (error) {
    console.error('Error reordering media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder images' },
      { status: 500 }
    );
  }
}
