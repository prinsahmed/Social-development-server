const express = require("express");
const router = express.Router();
const {
  createEvent,
  upcomingEvents,
  configureEvent,
  joinEvent,
  joinedEvent,
  manageEvent,
  updateEvent,
} = require("../controllers/eventsController");
const { authenticateToken } = require("../middleWares/authMiddleWare");

router.post("/create-event", createEvent);
router.get("/events", upcomingEvents);
router.get(["/event-details/:id", "/edit-event/:id"], configureEvent);
router.post("/join-event", joinEvent);
router.get("/joined-event", joinedEvent);
router.get("/manage-event", authenticateToken, manageEvent);
router.put("/update-event/:id", authenticateToken, updateEvent);

module.exports = router;
