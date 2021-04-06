const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Messages = require("./dbMessages");
const cors = require("cors");
const Pusher = require("pusher");
const port = process.env.PORT || 5055;
require("dotenv").config();

const pusher = new Pusher({
  appId: "1183411",
  key: "78de5c1299a9a28fc770",
  secret: "8c8b9709e1e36feacf93",
  cluster: "eu",
  useTLS: true,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const MONGODB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b46az.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected");

  const msgCollection = db.collection("messages");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messagesDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messagesDetails.name,
        message: messagesDetails.message,
        timestamp: messagesDetails.timestamp,
        received: messagesDetails.received,
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/", (req, res) => {
  res.status(200).send("hello world");
});

app.listen(port, () => console.log(`Listening to port ${port}`));
