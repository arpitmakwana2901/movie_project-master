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
    return <p className="text-center mt-10">Invalid Payment Request</p>;
  }

  const handlePayment = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/successpayment/pay`,
        {
          bookingId: booking._id, // ✅ seat-booking _id
          movieId: booking.movieId, // ✅ Show _id
          amount: booking.totalAmount, // ✅ amount
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("ticket purchased successfully 🎟️");
        navigate("/my-bookings", {
          state: {
            success: true,
            message: "ticket purchased successfully",
          },
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <div className="bg-primary/10 p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Payment</h2>

        <p className="mb-2">
          <span className="text-gray-400">Movie:</span> {booking.movieTitle}
        </p>

        <p className="mb-2">
          <span className="text-gray-400">Seats:</span>{" "}
          {booking.seats.join(", ")}
        </p>

        <p className="mb-4">
          <span className="text-gray-400">Amount:</span> ₹{booking.totalAmount}
        </p>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-semibold"
        >
          {loading ? "Processing..." : "Conform Payment"}
        </button>
      </div>
    </div>
  );
};

export default DonePayment;
