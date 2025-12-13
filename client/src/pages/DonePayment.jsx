import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { API_URL } from "../App";
import { useAuth } from "../components/context/AuthContext";

const DonePayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const booking = state?.booking;
  const authData = useAuth();
  const token = authData?.token;
  const [loading, setLoading] = useState(false);

  if (!booking) {
    toast.error("Invalid booking data");
    navigate("/");
    return null;
  }

  // Validate booking data
  const validateBooking = () => {
    const errors = [];

    if (!booking._id) errors.push("Booking ID is missing");
    if (!booking.movieId) errors.push("Movie ID is missing");
    if (!booking.movieTitle) errors.push("Movie title is missing");
    if (!booking.seats || booking.seats.length === 0)
      errors.push("No seats selected");
    if (!booking.totalAmount || booking.totalAmount <= 0)
      errors.push("Invalid amount");

    return errors;
  };

  const handlePayment = async () => {
    const validationErrors = validateBooking();
    if (validationErrors.length > 0) {
      toast.error(`Validation errors: ${validationErrors.join(", ")}`);
      return;
    }

    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Starting payment process...");

      // Prepare data for backend
      const paymentData = {
        bookingId: booking._id,
        amount: booking.totalAmount,
        movieTitle: booking.movieTitle,
        seats: booking.seats,
        movieId: booking.movieId,
        theaterName: booking.theaterName || "Cinema Hall",
        showTime: booking.showTime || new Date().toISOString(),
        screen: booking.screen || "Screen 1",
      };

      console.log("📤 Sending to backend:", paymentData);
      console.log("API_URL:", API_URL);

      const res = await axios.post(
        `${API_URL}/payments/process-payment`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 seconds timeout
        }
      );

      console.log("✅ Backend response:", res.data);

      if (res.data.success) {
        toast.success("✅ Payment successful! Booking saved to database.");

        // Navigate to My Bookings with success data
        navigate("/my-bookings", {
          state: {
            success: true,
            bookingId: res.data.data.bookingId,
            paymentId: res.data.data.paymentId,
            message: "Booking confirmed successfully!",
          },
          replace: true,
        });
      } else {
        toast.error(res.data.message || "Payment failed");
      }
    } catch (error) {
      console.error("❌ Payment error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      let errorMessage = "Payment failed. Please try again.";

      if (error.response) {
        // Server responded with error
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please try again.";
      }

      toast.error(`Error: ${errorMessage}`);

      // Show retry option
      if (confirm(`${errorMessage}\n\nDo you want to retry?`)) {
        handlePayment();
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Confirm Booking</h1>
          <p className="text-gray-400">
            Review your booking details before payment
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700 shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400">Movie</span>
              <span className="font-bold text-lg text-white">
                {booking.movieTitle}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Theater</span>
              <span>{booking.theaterName || "Standard Theater"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Seats</span>
              <span className="font-medium bg-gray-700 px-3 py-1 rounded">
                {Array.isArray(booking.seats)
                  ? booking.seats.join(", ")
                  : booking.seats}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Show Time</span>
              <span>{formatDate(booking.showTime)}</span>
            </div>

            {booking.screen && (
              <div className="flex justify-between">
                <span className="text-gray-400">Screen</span>
                <span>{booking.screen}</span>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-gray-700">
              <div className="flex justify-between items-center text-xl">
                <span className="text-gray-300">Total Amount</span>
                <span className="font-bold text-2xl text-green-400">
                  ₹{booking.totalAmount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-6 w-6 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              "Confirm Payment & Save to Database"
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✅ Your booking will be saved in our secure database</p>
          <p className="mt-1">
            🔒 Secure payment • Instant confirmation • Email receipt
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonePayment;
