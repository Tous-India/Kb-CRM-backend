import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

/**
 * Address Sub-Schema
 * Reusable for billing / shipping
 */
const AddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  { _id: false }
);

/**
 * Company Details (for BUYER)
 */
const CompanyDetailsSchema = new Schema(
  {
    company_name: String,
    tax_id: String,
    phone: String,
    billing_email: String,
  },
  { _id: false }
);

/**
 * Credit Information (for BUYER)
 */
const CreditInfoSchema = new Schema(
  {
    payment_terms: {
      type: String,
      default: "WIRE TRANSFER",
    },
    credit_days: {
      type: Number,
      default: 0,
    },
    discount_code: {
      type: String,
      default: "",
    },
    credit_limit: {
      type: Number,
      default: 0,
    },
    credit_used: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * Main User Schema
 */
const UserSchema = new Schema(
  {
    // Custom readable ID (USR-XXXXX / ADM-XXXXX)
    user_id: {
      type: String,
      unique: true,
      index: true,
    },

    // Role based access control
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "SUB_ADMIN", "BUYER"],
      required: true,
      index: true,
    },

    // Basic info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
 
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // never return password by default
    },

    phone: {
      type: String,
    },

    fax: {
      type: String,
    },

    website: {
      type: String,
    },

    address: AddressSchema,

    /**
     * Permissions
     * Only applicable to SUB_ADMIN
     * SUPER_ADMIN automatically has all permissions
     */
    permissions: {
      type: [String],
      default: [],
    },

    /**
     * BUYER specific fields
     */
    status_quote: {
      type: Boolean,
      default: false,
    },

    payment_status: {
      type: String,
      enum: ["PAID", "UNPAID"],
      default: "UNPAID",
    },

    company_details: CompanyDetailsSchema,

    /**
     * Credit Information (for BUYER)
     */
    credit_info: CreditInfoSchema,

    /**
     * Active orders for quick access
     * Full order history is queried from the Orders collection
     */
    current_orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    /**
     * Account state
     */
    is_active: {
      type: Boolean,
      default: true,
    },

    last_login: {
      type: Date,
    },

    /**
     * Password reset fields (legacy - token based)
     */
    passwordResetToken: String,
    passwordResetExpires: Date,

    /**
     * Email verification (for registration)
     */
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_otp: String,
    email_otp_expires: Date,

    /**
     * Password reset OTP fields
     */
    password_reset_otp: String,
    password_reset_otp_expires: Date,

    /**
     * Registration approval (for BUYER)
     * PENDING - waiting for admin approval
     * APPROVED - approved by admin, can login
     * REJECTED - rejected by admin
     */
    approval_status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED", // Admins are auto-approved, buyers start as PENDING during registration
    },
    approval_date: Date,
    approved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejection_reason: String,
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// ===========================
// Pre-save: Hash password
// ===========================
UserSchema.pre("save", async function () {
  // Only hash if password was changed (or new)
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ===========================
// Pre-save: Auto-generate user_id
// ===========================
UserSchema.pre("save", async function () {
  if (this.user_id) return;

  // Prefix based on role
  const prefix = this.role === "BUYER" ? "USR" : "ADM";

  // Find the last user with the same prefix to get the next number
  const lastUser = await mongoose
    .model("User")
    .findOne({ user_id: new RegExp(`^${prefix}-`) })
    .sort({ user_id: -1 })
    .select("user_id");

  let nextNum = 1;
  if (lastUser) {
    const lastNum = parseInt(lastUser.user_id.split("-")[1], 10);
    nextNum = lastNum + 1;
  }

  // Format: USR-00001 or ADM-00001
  this.user_id = `${prefix}-${String(nextNum).padStart(5, "0")}`;
});

// ===========================
// Method: Compare password
// ===========================
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ===========================
// Export Model
// ===========================
const User = mongoose.model("User", UserSchema);

export default User;
