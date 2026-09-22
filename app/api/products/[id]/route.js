import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import Feedback from '@/models/Feedback';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    } else {
      query = { slug: id };
    }

    const product = await Product.findOne(query);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get approved feedback for this product
    const reviews = await Feedback.find({
      productSlug: product.slug,
      isApproved: true,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      product,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve product details' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const data = await request.json();

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    } else {
      query = { slug: id };
    }

    // If marked as hero, unset hero flag on all other products
    if (data.isHero) {
      await Product.updateMany({}, { isHero: false });
    }

    const updated = await Product.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    } else {
      query = { slug: id };
    }

    const deleted = await Product.findOneAndDelete(query);
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Clean up related feedback
    await Feedback.deleteMany({ productSlug: deleted.slug });

    return NextResponse.json({
      success: true,
      message: 'Product and associated feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
