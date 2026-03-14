const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const eventsRouter = require("./backend/routes/eventRoutes");
const { connectDB } = require("./backend/db/mongoDB");
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use(eventsRouter);

const startServer = async () => {
  try {
    await connectDB();

    app.get("/", (req, res) => {
      res.send("Event Server is running...");
    });

    // app.listen(port, () => {
    //   console.log(`Server is running on port ${port}`);
    // });
  } catch (error) {
    // console.error("Failed to start server:", error);
  }
};

startServer();

module.exports = app;
