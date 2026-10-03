import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import Product from '@/models/Product';
import { requirePermissions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// Helper to recalculate average rating & review count for a product
async function updateProductRatingStats(productSlug) {
  const approvedReviews = await Feedback.find({ productSlug, isApproved: true });
  const count = approvedReviews.length;
  let avg = 5.0;
  if (count > 0) {
    const sum = approvedReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    avg = Math.round((sum / count) * 10) / 10;
  }
  await Product.findOneAndUpdate(
    { slug: productSlug },
    { reviews: count, rating: avg }
  );
}

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const isAdminQuery = searchParams.get('admin') === 'true';
    const productSlug = searchParams.get('productSlug');
    const status = searchParams.get('status'); // 'pending' | 'approved' | 'all'

    if (isAdminQuery) {
      const { response } = await requirePermissions(request, ['feedback.moderate']);
      if (response) return response;

      let query = {};
      if (status === 'pending') {
        query.isApproved = false;
      } else if (status === 'approved') {
        query.isApproved = true;
      }

      const reviews = await Feedback.find(query).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, reviews });
    }

    // Public query: require productSlug and only return approved
    if (!productSlug) {
      return NextResponse.json(
        { error: 'productSlug query parameter is required for public feedback list' },
        { status: 400 }
      );
    }

    const reviews = await Feedback.find({
      productSlug,
      isApproved: true,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Spam protection: 10 reviews per hour per IP
    if (!rateLimit(`feedback:${getClientIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many reviews submitted. Please try again later.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const data = await request.json();

    const { productSlug, productName, userName, userEmail, rating, title, comment } = data;

    if (!productSlug || !userName || !userEmail || !rating || !comment) {
      return NextResponse.json(
        { error: 'Please provide all required fields: name, email, rating, and feedback comment.' },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(userEmail.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    if (String(userName).trim().length > 80 || String(comment).trim().length > 2000 || String(title || '').trim().length > 120) {
      return NextResponse.json({ error: 'Review fields exceed maximum length.' }, { status: 400 });
    }

    // Only allow reviews for products that exist
    const product = await Product.findOne({ slug: productSlug }).select('_id name slug').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const newFeedback = await Feedback.create({
      productId: product._id,
      productSlug: product.slug,
      productName: product.name,
      userName: String(userName).trim().slice(0, 80),
      userEmail: String(userEmail).trim().toLowerCase(),
      rating: ratingNum,
      title: title ? String(title).trim().slice(0, 120) : '',
      comment: String(comment).trim().slice(0, 2000),
      isApproved: false, // Must be approved by admin before displaying on website
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your feedback! Your review has been submitted and will appear on the website once approved by our moderation team.',
        feedback: newFeedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { response } = await requirePermissions(request, ['feedback.moderate']);
    if (response) return response;

    await connectToDatabase();
    const { feedbackId, isApproved } = await request.json();

    if (!feedbackId || typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'feedbackId and isApproved (boolean) are required' },
        { status: 400 }
      );
    }

    const updated = await Feedback.findByIdAndUpdate(
      feedbackId,
      { isApproved },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 });
    }

    // Update product rating stats
    if (updated.productSlug) {
      await updateProductRatingStats(updated.productSlug);
    }

    return NextResponse.json({
      success: true,
      message: isApproved ? 'Review approved and published!' : 'Review status updated to pending',
      feedback: updated,
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update feedback status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { response } = await requirePermissions(request, ['feedback.moderate']);
    if (response) return response;

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('id');

    if (!feedbackId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const deleted = await Feedback.findByIdAndDelete(feedbackId);
    if (!deleted) {
      return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 });
    }

    if (deleted.productSlug) {
      await updateProductRatingStats(deleted.productSlug);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
