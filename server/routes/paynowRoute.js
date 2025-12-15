const express = require("express");
const mongoose = require("mongoose");
const CheckoutModel = require("../models/checkoutModel");
const authenticate = require("../middlewere/auth");
const paynowRoute = express.Router();

// // ✅ Process Payment with Authentication
// paynowRoute.post("/process-payment", authenticate, async (req, res) => {
//   console.log("=".repeat(60));
//   console.log("💰 PAYMENT PROCESSING STARTED");
//   console.log("User from auth (if available):", req.user);
//   const userId = req.user._id || req.user.userId;
//     console.log(userId, "userId");
//   try {
//     const {
//       bookingId,
//       amount,
//       movieTitle,
//       seats,
//       movieId,
//       theaterName,
//       showTime,
//       screen,
//     } = req.body;

//     console.log("📦 Full Request Body:", JSON.stringify(req.body, null, 2));

//     // Priority for userId:
//     // 1. From request body (frontend sends this)
//     // 2. From authenticated user (req.user.id)
//     // 3. From token payload (req.user._id, etc.)
//     let finalUserId = userId;

//     if (!finalUserId && req.user) {
//       // Try from authenticated user
//       finalUserId = req.user.id || req.user._id || req.user.userId;
//       console.log("🔍 Trying to get userId from authenticated user:", finalUserId);
//     }

//     console.log("✅ Final User ID to use:", finalUserId);

//     // Validate required fields
//     if (!bookingId || !movieId || !finalUserId) {
//       console.log("❌ Missing fields:", {
//         bookingId: !bookingId,
//         movieId: !movieId,
//         userId: !finalUserId
//       });
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${!bookingId ? "bookingId " : ""}${!movieId ? "movieId " : ""}${!finalUserId ? "userId" : ""}`
//       });
//     }

//     console.log("✅ All validations passed");

//     // Check database connection
//     if (mongoose.connection.readyState !== 1) {
//       console.log("❌ MongoDB not connected");
//       return res.status(500).json({
//         success: false,
//         message: "Database connection error"
//       });
//     }

//     // Generate payment IDs
//     const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
//     const orderId = `ORD${Date.now()}`;

//     // Create booking object
//     const bookingData = {
//       _id: bookingId,
//       movieId: new mongoose.Types.ObjectId(movieId),
//       movieTitle: movieTitle || "Movie",
//       userId: new mongoose.Types.ObjectId(finalUserId), // Use the finalUserId
//       seats: Array.isArray(seats) ? seats : [String(seats || "A1")],
//       totalAmount: Number(amount) || 0,
//       theaterName: theaterName || "Theater",
//       showTime: showTime ? new Date(showTime) : new Date(),
//       screen: screen || "Screen 1",
//       isPaid: true,
//       paymentDate: new Date(),
//       paymentId: paymentId,
//       orderId: orderId,
//       paymentStatus: "completed",
//     };

//     console.log("💾 Booking data to save:", bookingData);

//     // Save to database
//     let savedBooking;
//     try {
//       const existing = await CheckoutModel.findById(bookingId);

//       if (existing) {
//         // Update existing
//         savedBooking = await CheckoutModel.findByIdAndUpdate(
//           bookingId,
//           {
//             isPaid: true,
//             paymentDate: new Date(),
//             paymentId: paymentId,
//             orderId: orderId,
//             paymentStatus: "completed"
//           },
//           { new: true }
//         );
//         console.log("✅ Existing booking updated");
//       } else {
//         // Create new
//         const newBooking = new CheckoutModel(bookingData);
//         savedBooking = await newBooking.save();
//         console.log("✅ New booking created");
//       }
//     } catch (dbError) {
//       console.error("❌ Database error:", dbError);
//       throw dbError;
//     }

//     console.log("✅ Booking saved successfully:", savedBooking._id);

//     // Send success response
//     res.status(200).json({
//       success: true,
//       message: "🎉 Payment successful! Booking saved to database.",
//       data: {
//         bookingId: savedBooking._id,
//         paymentId: savedBooking.paymentId,
//         orderId: savedBooking.orderId,
//         movieTitle: savedBooking.movieTitle,
//         seats: savedBooking.seats,
//         amount: savedBooking.totalAmount,
//         userId: savedBooking.userId
//       }
//     });

//   } catch (error) {
//     console.error("❌ Payment processing error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Payment failed: " + error.message
//     });
//   }
// });

// module.exports = paynowRoute;

paynowRoute.post("/process-payment", authenticate, async (req, res) => {
  const userId = req.user.userId; // ✅ ONLY SOURCE

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { bookingId, movieId, amount } = req.body;

  if (!bookingId || !movieId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const bookingData = {
    _id: bookingId,
    movieId: new mongoose.Types.ObjectId(movieId),
    userId: new mongoose.Types.ObjectId(userId),
    totalAmount: amount,
    isPaid: true,
  };

  const saved = await CheckoutModel.create(bookingData);

  res.json({
    success: true,
    data: saved,
  });
});

module.exports = paynowRoute;
