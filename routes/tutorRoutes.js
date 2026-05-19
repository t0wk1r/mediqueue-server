const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Add tutor
router.post("/tutors", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");

    const tutor = {
      ...req.body,
      hourlyFee: Number(req.body.hourlyFee),
      totalSlot: Number(req.body.totalSlot),
      createdByName: req.user.name,
      createdByEmail: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tutorsCollection.insertOne(tutor);

    res.status(201).json({
      success: true,
      message: "Tutor created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create tutor",
      error: error.message,
    });
  }
});

// Get all tutors + search + filter + limit
router.get("/tutors", async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");

    const { search, startDate, endDate, limit } = req.query;

    const query = {};

    if (search) {
      query.tutorName = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      query.sessionDate = {};

      if (startDate) {
        query.sessionDate.$gte = startDate;
      }

      if (endDate) {
        query.sessionDate.$lte = endDate;
      }
    }

    let cursor = tutorsCollection.find(query).sort({ createdAt: -1 });

    if (limit) {
      cursor = cursor.limit(Number(limit));
    }

    const tutors = await cursor.toArray();

    res.json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get tutors",
      error: error.message,
    });
  }
});

// Get single tutor
router.get("/tutors/:id", async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");

    const id = req.params.id;

    const tutor = await tutorsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    res.json({
      success: true,
      data: tutor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get tutor",
      error: error.message,
    });
  }
});

// My tutors
router.get("/my-tutors", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");

    const tutors = await tutorsCollection
      .find({ createdByEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get my tutors",
      error: error.message,
    });
  }
});

// Update tutor
router.patch("/tutors/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");

    const id = req.params.id;

    const tutor = await tutorsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    if (tutor.createdByEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this tutor",
      });
    }

    const updatedTutor = {
      ...req.body,
      hourlyFee: Number(req.body.hourlyFee),
      totalSlot: Number(req.body.totalSlot),
      updatedAt: new Date(),
    };

    const result = await tutorsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedTutor }
    );

    res.json({
      success: true,
      message: "Tutor updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update tutor",
      error: error.message,
    });
  }
});

// Delete tutor
router.delete("/tutors/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const tutorsCollection = db.collection("tutors");

    const id = req.params.id;

    const tutor = await tutorsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    if (tutor.createdByEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this tutor",
      });
    }

    const result = await tutorsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.json({
      success: true,
      message: "Tutor deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete tutor",
      error: error.message,
    });
  }
});

module.exports = router;