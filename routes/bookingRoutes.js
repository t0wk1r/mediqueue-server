const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// check already booked
router.get("/bookings/check/:tutorId", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection("bookings");

    const { tutorId } = req.params;

    const booking = await bookingsCollection.findOne({
      tutorId,
      studentEmail: req.user.email,
      status: { $ne: "cancelled" },
    });

    res.json({
      success: true,
      alreadyBooked: !!booking,
      data: booking || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check booking",
      error: error.message,
    });
  }
});

// create booking
router.post("/bookings", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");
    const bookingsCollection = db.collection("bookings");

    const { tutorId, studentName, phone } = req.body;

    if (!tutorId || !studentName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (!ObjectId.isValid(tutorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tutor id",
      });
    }

    const tutor = await tutorsCollection.findOne({
      _id: new ObjectId(tutorId),
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    if (tutor.totalSlot <= 0) {
      return res.status(400).json({
        success: false,
        message: "This session is fully booked. You can’t join at the moment.",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    if (today < tutor.sessionDate) {
      return res.status(400).json({
        success: false,
        message: "Booking is not available yet for this tutor",
      });
    }

    const alreadyBooked = await bookingsCollection.findOne({
      tutorId,
      studentEmail: req.user.email,
      status: { $ne: "cancelled" },
    });

    if (alreadyBooked) {
      return res.status(400).json({
        success: false,
        message: "You have already booked this tutor session",
      });
    }

    const booking = {
      tutorId,
      tutorName: tutor.tutorName,
      studentName,
      studentEmail: req.user.email,
      phone,
      status: "booked",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bookingResult = await bookingsCollection.insertOne(booking);

    await tutorsCollection.updateOne(
      { _id: new ObjectId(tutorId) },
      {
        $inc: { totalSlot: -1 },
        $set: { updatedAt: new Date() },
      }
    );

    res.status(201).json({
      success: true,
      message: "Session booked successfully",
      data: bookingResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to book session",
      error: error.message,
    });
  }
});

// my bookings
router.get("/my-bookings", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection("bookings");

    const bookings = await bookingsCollection
      .find({ studentEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get bookings",
      error: error.message,
    });
  }
});

// cancel booking
router.patch("/bookings/:id/cancel", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection("bookings");

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.studentEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
});

module.exports = router;