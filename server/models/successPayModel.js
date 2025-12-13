const mongoose = require("mongoose");

const successPaySchema = mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId, // 👈 EXACT model name
      ref: "Show",
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
