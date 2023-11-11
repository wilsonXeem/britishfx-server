const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  referrenceCode: { type: String },
  transactionType: { type: String },
  amount: { type: Number },
  modeOfPayment: { type: String },
  status: { type: String, default: "pending" },
  dateOfTrans: { type: String, default: new Date().toLocaleDateString() },
  username: { type: String },
  email: { type: String },
  userId: { type: String },
});

module.exports = mongoose.model("Transactions", transactionSchema);
