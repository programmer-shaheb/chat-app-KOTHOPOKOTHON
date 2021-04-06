const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,
});

const Messages = mongoose.model("messages", messageSchema);
module.exports = Messages;
