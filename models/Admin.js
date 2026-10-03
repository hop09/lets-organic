import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'admin',
    },
    // Display name shown in the admin console
    name: {
      type: String,
      default: '',
      trim: true,
    },
    // Custom permission keys (see lib/permissions.js). Owners implicitly have all.
    permissions: {
      type: [String],
      default: [],
    },
    // Owners bypass all permission checks and can manage other owners.
    isOwner: {
      type: Boolean,
      default: false,
    },
    // Deactivated accounts cannot log in and their tokens stop working.
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
