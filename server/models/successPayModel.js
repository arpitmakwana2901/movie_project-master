const mongoose = require("mongoose");

const successPaySchema = mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "success",
    },
  },
  { timestamps: true }
);

const successPayModel = mongoose.model("successPay", successPaySchema);
module.exports = successPayModel;
