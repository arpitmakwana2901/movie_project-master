const express = require("express");
const successPayModel = require("../models/successPayModel");
const BookingModel = require("../models/bookingModel");
const authenticate = require("../middlewere/auth");
const successPay = express.Router();

successPay.post("/pay", authenticate, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ CHECK FIRST
    if (booking.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Ticket already paid",
      });
    }

    // ✅ SAVE PAYMENT
    await successPayModel.create({
      bookingId,
      amount,
      status: "success",
    });

    // ✅ MARK AS PAID
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
