const error = require("../util/error-handler");
const Transactions = require("../models/transactions");

const { userExist } = require("../util/finder");

module.exports.adminLogin = async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    if (username == "admin" && password == "bfxadmin") {
      const transactions = await Transactions.find().exec();ig

      res.status(200).json({
        message: "Admin log in successful",
        type: "admin",
        transactions, 
      });
    }
  } catch (err) {
    error.error(err, next);
  }
};

/* Verify deposit */
module.exports.verifyDeposit = async (req, res, next) => {
  const userId = req.params.id;
  const referenceCode = req.body.code;

  try {
    const user = await userExist("id", userId);

    if (!user) error.errorHandler(res, "User does not exist", "user");

    user.transactions.deposit.find(
      (dep) => dep.referrenceCode === referenceCode
    ).status = "success";

    user.transactions.allTransactions.find(
      (dep) => dep.referrenceCode === referenceCode
    ).status = "success";

    user.save();

    res.status(200).json({ message: "Deposit updated!", type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Verify withdrawal */
module.exports.verifyWithdrawal = async (req, res, next) => {
  const userId = req.params.id;
  const referenceCode = req.body.code;

  try {
    const user = await userExist("id", userId);

    if (!user) error.errorHandler(res, "User does not exist", "user");

    user.transactions.withdrawal.find(
      (wit) => wit.referrenceCode === referenceCode
    ).status = "success";

    user.transactions.allTransactions.find(
      (dep) => dep.referrenceCode === referenceCode
    ).status = "success";

    user.save();

    res.status(200).json({ message: "Deposit updated!", type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};
