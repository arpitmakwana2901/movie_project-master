const express = require("express");
const successPayModel = require("../models/successPayModel");
const BookingModel = require("../models/bookingModel");
const authenticate = require("../middlewere/auth");

const successPay = express.Router();

successPay.post("/pay", authenticate, async (req, res) => {
  try {
    const { movieId, amount } = req.body;

    // 🔎 FIND BOOKING
    const booking = await BookingModel.findById(movieId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ❌ ALREADY PAID
    if (booking.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Ticket already paid",
      });
    }

    // ✅ SAVE PAYMENT (MODEL KE HISAAB SE)
    await successPayModel.create({
      bookingId,
      movieId,
      amount,
      status: "success",
    });

    // ✅ MARK BOOKING AS PAID
    booking.isPaid = true;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "ticket purchased successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = successPay;
