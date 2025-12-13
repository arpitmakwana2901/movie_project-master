const express = require("express");
const mongoose = require("mongoose");
const CheckoutModel = require("../models/checkoutModel");
const authenticate = require("../middlewere/auth");
const paynowRoute = express.Router();

// ✅ Debug middleware - Log every request
paynowRoute.use((req, res, next) => {
  console.log(`🔵 ${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log(
    "🔐 Auth header:",
    req.headers.authorization ? "Present" : "Missing"
  );
  next();
});

// ✅ Process Payment - DATABASE ONLY
paynowRoute.post("/process-payment", authenticate, async (req, res) => {
  console.log("=".repeat(50));
  console.log("🔄 PAYMENT PROCESS STARTED");
  console.log("=".repeat(50));

  try {
    // Log full request
    console.log("📦 FULL REQUEST BODY:", JSON.stringify(req.body, null, 2));
    console.log("👤 USER FROM AUTH:", req.user);

    const {
      bookingId,
      amount,
      movieTitle,
      seats,
      movieId,
      theaterName,
      showTime,
      screen,
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    const missingFields = [];
    if (!bookingId) missingFields.push("bookingId");
    if (!movieId) missingFields.push("movieId");
    if (!userId) missingFields.push("userId");

    if (missingFields.length > 0) {
      console.log("❌ MISSING FIELDS:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check MongoDB connection
    console.log("📊 MongoDB Connection State:", mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      console.log("❌ MONGODB NOT CONNECTED!");
      return res.status(500).json({
        success: false,
        message: "Database connection error. Please try again.",
      });
    }

    // Generate IDs
    const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const orderId = `ORD${Date.now()}`;

    // Parse dates safely
    const paymentDate = new Date();
    let parsedShowTime;

    try {
      if (showTime) {
        parsedShowTime = new Date(showTime);
        if (isNaN(parsedShowTime.getTime())) {
          parsedShowTime = new Date();
        }
      } else {
        parsedShowTime = new Date();
      }
    } catch (dateError) {
      console.log(
        "⚠️ Date parsing error, using current time:",
        dateError.message
      );
      parsedShowTime = new Date();
    }

    // Prepare booking data
    const bookingData = {
      _id: bookingId,
      movieId: new mongoose.Types.ObjectId(movieId),
      movieTitle: movieTitle || "Movie",
      userId: new mongoose.Types.ObjectId(userId),
      seats: Array.isArray(seats) ? seats : [String(seats || "A1")],
      totalAmount: Number(amount) || 0,
      theaterName: theaterName || "Theater",
      showTime: parsedShowTime,
      screen: screen || "Screen 1",
      isPaid: true,
      paymentDate: paymentDate,
      paymentId: paymentId,
      orderId: orderId,
      paymentStatus: "completed",
    };

    console.log(
      "📝 FINAL BOOKING DATA TO SAVE:",
      JSON.stringify(bookingData, null, 2)
    );

    let savedBooking;

    // TRY 1: Find and update or create
    console.log("🔍 Looking for existing booking...");
    const existingBooking = await CheckoutModel.findById(bookingId);

    if (existingBooking) {
      console.log("✅ Found existing booking, updating...");
      // Update existing
      savedBooking = await CheckoutModel.findByIdAndUpdate(
        bookingId,
        {
          $set: {
            isPaid: true,
            paymentDate: paymentDate,
            paymentId: paymentId,
            orderId: orderId,
            paymentStatus: "completed",
          },
        },
        { new: true }
      );
      console.log("✅ Booking updated in DB");
    } else {
      console.log("🆕 No existing booking, creating new...");
      // Create new
      try {
        savedBooking = new CheckoutModel(bookingData);
        await savedBooking.save();
        console.log("✅ New booking saved to DB");
      } catch (saveError) {
        console.error("❌ Save error details:", {
          name: saveError.name,
          message: saveError.message,
          code: saveError.code,
          keyPattern: saveError.keyPattern,
          keyValue: saveError.keyValue,
        });
        throw saveError;
      }
    }

    console.log("💾 SAVED BOOKING FROM DB:", savedBooking);

    // Send success response
    const responseData = {
      success: true,
      message: "🎉 Payment successful! Booking saved to database.",
      data: {
        bookingId: savedBooking._id,
        paymentId: savedBooking.paymentId,
        orderId: savedBooking.orderId,
        movieTitle: savedBooking.movieTitle,
        seats: savedBooking.seats,
        amount: savedBooking.totalAmount,
        paymentDate: savedBooking.paymentDate,
        paymentStatus: savedBooking.paymentStatus,
      },
    };

    console.log(
      "✅ PAYMENT SUCCESS - Response:",
      JSON.stringify(responseData, null, 2)
    );
    console.log("=".repeat(50));

    res.status(200).json(responseData);
  } catch (error) {
    console.error("=".repeat(50));
    console.error("❌ PAYMENT ERROR DETAILS:");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    if (error.name === "ValidationError") {
      console.error(
        "Validation Errors:",
        JSON.stringify(error.errors, null, 2)
      );
    }

    if (error.name === "MongoServerError") {
      console.error("MongoDB Error Code:", error.code);
      console.error("MongoDB Error Details:", error);
    }

    console.error("=".repeat(50));

    // User-friendly error messages
    let errorMessage = "Payment processing failed";

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      errorMessage = `Validation error: ${messages.join(", ")}`;
    } else if (error.name === "MongoServerError" && error.code === 11000) {
      errorMessage = "Duplicate booking detected. Please try again.";
    } else if (error.message.includes("buffering timed out")) {
      errorMessage = "Database connection timeout. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Test MongoDB Connection Route
paynowRoute.get("/test-db", async (req, res) => {
  console.log("🧪 Testing DB Connection...");

  try {
    const dbState = mongoose.connection.readyState;
    console.log("MongoDB Connection State:", dbState);

    // Try a simple query
    const count = await CheckoutModel.countDocuments({});
    console.log("Total bookings in DB:", count);

    // Test creating a document
    const testDoc = new CheckoutModel({
      _id: "test_" + Date.now(),
      movieId: new mongoose.Types.ObjectId(),
      movieTitle: "Test Movie",
      userId: new mongoose.Types.ObjectId(),
      seats: ["T1", "T2"],
      totalAmount: 100,
      theaterName: "Test Theater",
      isPaid: false,
    });

    const saved = await testDoc.save();
    console.log("Test document saved:", saved._id);

    // Clean up
    await CheckoutModel.deleteOne({ _id: saved._id });

    res.json({
      success: true,
      message: "✅ Database test successful",
      dbConnected: dbState === 1,
      documentCount: count,
      testDocumentId: saved._id,
    });
  } catch (error) {
    console.error("❌ DB Test Error:", error);
    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message,
      dbState: mongoose.connection.readyState,
    });
  }
});

module.exports = paynowRoute;
