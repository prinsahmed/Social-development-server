const { getCollection } = require("../db/mongoDB");
const { ObjectId } = require("mongodb");

const createEvent = async (req, res) => {
  const eventData = req.body;
  const { title, description, eventCat, selectedDate, location, photoURL } =
    eventData;

  if (!title || title.trim() === "") {
    return res.status(400).send({ error: "Title is required" });
  }
  if (!description || description.trim().length < 10) {
    return res
      .status(400)
      .send({ error: "Description must be at least 10 characters" });
  }
  if (!["Cleanup", "Plantation", "Donation", "Awareness"].includes(eventCat)) {
    return res.status(400).send({ error: "Invalid event type" });
  }
  if (!selectedDate || new Date(selectedDate) < new Date()) {
    return res.status(400).send({ error: "Date must be in the future" });
  }
  if (!location || location.length === 0) {
    return res.status(400).send({ error: "Location is required" });
  }
  if (!photoURL) {
    return res.status(400).send({ error: "Photo is required" });
  }

  const result = await getCollection("createEvent").insertOne(eventData);
  res.send(result);
};

const upcomingEvents = async (req, res) => {
  const { category, q } = req.query;
  const today = new Date();

  const result = await getCollection("createEvent")
    .aggregate([
      {
        $addFields: {
          selectedDateObj: { $toDate: "$selectedDate" },
        },
      },
      {
        $match: {
          selectedDateObj: { $gte: today },
          ...(category ? { eventCat: category } : {}),
          ...(q
            ? {
                $or: [{ title: { $regex: q.trim(), $options: "i" } }],
              }
            : {}),
        },
      },
      { $sort: { selectedDateObj: 1 } },
    ])
    .toArray();

  res.send(result);
};

const configureEvent = async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await getCollection("createEvent").findOne(query);
  res.send(result);
};

const joinEvent = async (req, res) => {
  const joinEventData = req.body;
  const result = await getCollection("joinEvent").insertOne(joinEventData);
  res.send(result);
};

const joinedEvent = async (req, res) => {
  const email = req.query.email;
  const query = {
    email: email,
  };
  const sortFields = { selectedDate: -1 };
  const result = await getCollection("joinEvent")
    .find(query)
    .sort(sortFields)
    .toArray();
  res.send(result);
};

const manageEvent = async (req, res) => {
  const email = req.query.email;
  console.log(email)
  const query = { email: email };
  const result = await getCollection("createEvent").find(query).toArray();
  res.send(result);
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const updatedData = req.body;
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      ...updatedData,
    },
  };

  const result = await getCollection("createEvent").updateOne(
    query,
    updateDoc,
    options,
  );
  res.send(result);
};

module.exports = {
  createEvent,
  upcomingEvents,
  configureEvent,
  joinEvent,
  joinedEvent,
  manageEvent,
  updateEvent,
};
