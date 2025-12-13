const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    movieTitle: {
      type: String,
      required: true,
      default: "Unknown Movie",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    seats: {
      type: [String],
      required: true,
      default: ["A1"],
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    theaterName: {
      type: String,
      required: true,
      default: "Unknown Theater",
    },
    showTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    screen: {
      type: String,
      default: "Screen 1",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentDate: {
      type: Date,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields
  }
);

// Remove any unique constraints that might cause issues
checkoutSchema.index({ paymentId: 1 });

const CheckoutModel = mongoose.model("Checkout", checkoutSchema);

module.exports = CheckoutModel;
