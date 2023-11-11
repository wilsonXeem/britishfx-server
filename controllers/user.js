const User = require("../models/user");
const Transactions = require("../models/transactions");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

const error = require("../util/error-handler");
const { userExist } = require("../util/finder");

const schedule = require("node-schedule");

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  secure: true,
  port: 465,
  auth: {
    user: "support@britishfx.net",
    pass: "mosqueboy10",
  },
});

schedule.scheduleJob("0 23 * * *", async () => {
  await User.find({ investmentPlan: "bronze" })
    .exec()
    .then((users) => {
      users.map(async (user) => {
        let userr = await User.findOne({ email: user.email });
        userr.account.earnings += 0.0143 * userr.account.deposit;
        await userr.save();
        console.log("bronze");
      });
    });

  await User.find({ investmentPlan: "silver" })
    .exec()
    .then((users) => {
      users.map(async (user) => {
        let userr = await User.findOne({ email: user.email });
        userr.account.earnings += 0.0214 * userr.account.deposit;
        await userr.save();
        console.log("silver");
      });
    });

  await User.find({ investmentPlan: "gold" })
    .exec()
    .then((users) => {
      users.map(async (user) => {
        let userr = await User.findOne({ email: user.email });
        userr.account.earnings += 0.0286 * userr.account.deposit;
        await userr.save();
        console.log("gold");
      });
    });
});

module.exports.userSignUp = async (req, res, next) => {
  const investmentPlan = req.body.investmentPlan,
    username = req.body.username,
    password = req.body.password,
    email = req.body.email,
    country = req.body.country;

  try {
    // Check for Validation errors
    const validationErrors = validationResult(req);
    error.validationError(validationErrors, res);

    // Check if user email already exist
    const emailExist = await userExist("email", email);
    if (emailExist) {
      error.errorHandler(
        res,
        "Email already exists! Kindly Login to continue or use another email.",
        "email"
      );
    } else {
      // Create new user
      const user = new User({
        investmentPlan,
        username,
        password,
        email,
        country,
      });

      // Save user to database
      const newUser = await user.save();

      console.log(newUser.email);

      const mailOptions = {
        from: "<support@britishfx.net>",
        to: email,
        subject: "BritishFX Account Verification",
        html: `<h1>Dear ${username}</h1>
              <p>Your account has been verified. Kindly click below to verify your account</p>
              <button style="font-size: large; width: 30%; height: 3rem; font-weight: bold; background-color: blue;" ><a href="https://britishfx.net/login/${email}" onclick="verify()" style="text-decoration: none; color: white;">Log in</a></button>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent successfully: " + info.response);
        }
      });

      // Send response
      res.status(200).json({
        message:
          "Sign up successful! You will receive a mail shortly to confirm your email. Verify your email to continue.",
        type: "user",
        newUser,
      });
    }
  } catch (err) {
    error.error(err, next);
  }
};

/* Referral Signup */
module.exports.referralSignUp = async (req, res, next) => {
  const investmentPlan = req.body.investmentPlan,
    username = req.body.username,
    password = req.body.password,
    email = req.body.email,
    country = req.body.country,
    sponsor = req.body.sponsor;

  try {
    // Check for Validation errors
    const validationErrors = validationResult(req);
    error.validationError(validationErrors, res);

    // Check if user email already exist
    const emailExist = await userExist("email", email);
    if (emailExist) {
      error.errorHandler(
        res,
        "Email already exists! Kindly Login to continue or use another email.",
        "email"
      );
    } else {
      // Create new user
      const user = new User({
        investmentPlan,
        username,
        password,
        email,
        country,
        referredBy: sponsor,
      });

      const reff = await User.findOne({ username: sponsor });
      reff.referral.push({ email: email, plan: investmentPlan });

      // Save user to database
      const newUser = await user.save();
      await reff.save();

      const mailOptions = {
        from: "<support@britishfx.net>",
        to: email,
        subject: "BritishFX Account Verification",
        html: `<h1>Dear ${username}</h1>
              <p>Your account has been verified. Kindly click below to verify your account</p>
              <button style="font-size: large; width: 30%; height: 3rem; font-weight: bold; background-color: blue;" ><a href="https://britishfx.net/login" style="text-decoration: none; color: white;">Log in</a></button>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent successfully: " + info.response);
        }
      });

      // Send response
      res.status(200).json({
        message:
          "Sign up successful! You will receive a mail shortly to confirm your email. Verify your email to continue.",
        type: "user",
        newUser,
      });
    }
  } catch (err) {
    error.error(err, next);
  }
};

/** User Log in **/
module.exports.userLogin = async (req, res, next) => {
  const email = req.body.email,
    password = req.body.password;

  try {
    // Check for validation errors
    const validationErrors = validationResult(req);
    error.validationError(validationErrors, res);

    // Check if user exist
    const emailExist = await userExist("email", email);
    if (!emailExist) error.errorHandler(res, "incorrect email", "email");
    if (emailExist.password !== password)
      error.errorHandler(res, "incorrect password", "password");

    if (emailExist.verified == false) {
      error.errorHandler(res, "User not verified", "verify");
    }
    // Continue if no errors
    const user = emailExist;
    res.status(200).json({ message: "Sign in successful", type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Get user */
module.exports.getUser = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await userExist("id", userId);

    if (!user) error.errorHandler(res, "User does not exist", "user");

    res.status(200).json({ message: "User Found", type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Update User Information */
module.exports.updateUserInfo = async (req, res, next) => {
  try {
    const fullname = req.body.fullname,
      mobile = req.body.mobile,
      btc = req.body.btc,
      nkName = req.body.nkname,
      nkMobile = req.body.nkmobile,
      country = req.body.country,
      userId = req.params.id;

    let user = await User.findById(userId);
    user.fullname = fullname;
    user.mobile = mobile;
    user.btc = btc;
    user.nkName = nkName;
    user.nkMobile = nkMobile;
    user.country = country;

    await user.save();

    res
      .status(200)
      .json({ message: "User Info updated Successfully", type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Verify user */
module.exports.verifyUser = async (req, res, next) => {
  const email = req.body.email;

  try {
    const user = await userExist("email", email);

    if (!user) {
      error.errorHandler(res, "User does not exist", "email");
    } else {
      const mailOption = {
        from: "<support@britishfx.net>",
        to: email,
        subject: "BritishFX Account Password Reset",
        html: `<p>Kindly click below to reset your password</p>
              <button style="font-size: large; width: 30%; height: 3rem; font-weight: bold; background-color: blue;" ><a href="https://britishfx.net/password-reset/${email}" style="text-decoration: none; color: white;">Reset</a></button>`,
      };

      transporter.sendMail(mailOption, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent successfully: " + info.response);
        }
      });
    }

    res.status(200).json({ message: "Email verified", type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

// Password Reset
module.exports.reset = async (req, res, next) => {
  const email = req.params.email,
    password = req.body.password;

  try {
    await User.findOneAndUpdate(email, { password: password });
    res
      .status(200)
      .json({ message: "Password changed successfully", type: "user" });
  } catch (err) {
    error.error(err, next);
  }
};

let minm = 100000;
let maxm = 999999;
let numGen = Math.floor(Math.random() * (maxm - minm + 1)) + minm;

// Deposit Update
module.exports.depositUpdate = async (req, res, next) => {
  const email = req.body.email,
    amount = req.body.amount,
    modeOfPayment = req.body.modeOfPayment;

  try {
    let user = await User.findOne({ email });
    user.account.deposit += amount;
    await user.transactions.deposit.unshift({
      referrenceCode: numGen,
      amount: amount,
      modeOfPayment: modeOfPayment,
      username: user.username,
      userId: user._id,
      email: user.email,
    });

    await user.transactions.allTransactions.unshift({
      referrenceCode: numGen,
      amount: amount,
      modeOfPayment: modeOfPayment,
      transactionType: "deposit",
    });

    let transactions = new Transactions({
      referrenceCode: numGen,
      amount: amount,
      modeOfPayment: modeOfPayment,
      username: user.username,
      email: user.email,
      userId: user._id,
      transactionType: "deposit",
    });

    await transactions.save();

    await user.save();
    res
      .status(200)
      .json({ message: "Deposit done successfully", type: "deposit", user });
  } catch (err) {
    error.error(err, next);
  }
};

// Withdrawal Update
module.exports.withdrawalUpdate = async (req, res, next) => {
  const email = req.body.email,
    amount = req.body.amount,
    modeOfPayment = req.body.modeOfPayment;

  try {
    let user = await User.findOne({ email });
    user.account.withdrawal += amount;
    await user.transactions.withdrawal.unshift({
      referrenceCode: numGen,
      amount: amount,
      modeOfPayment: modeOfPayment,
      username: user.username,
      email: user.email,
      userId: user._id,
    });

    await user.transactions.allTransactions.unshift({
      referrenceCode: numGen,
      amount: amount,
      modeOfPayment: modeOfPayment,
      transactionType: "withdrawal",
    });

    let transactions = new Transactions({
      referrenceCode: numGen,
      amount: amount,
      modeOfPayment: modeOfPayment,
      username: user.username,
      email: user.email,
      userId: user._id,
      transactionType: "deposit",
    });

    await transactions.save();

    await user.save();
    res.status(200).json({
      message: "Withdrawal done successfully",
      type: "withdrawal",
      user,
    });
  } catch (err) {
    error.error(err, next);
  }
};

module.exports.verifyUserAccount = async (req, res, next) => {
  const email = req.params.email;

  try {
    const user = await userExist("email", email);

    if (!user) {
      error.errorHandler(res, "User does not exist", "email");
    } else {
      user.verified = true;
      await user.save();

      res.status(200).json({ message: "Account Verified" });
    }
  } catch (err) {
    error.error(err, next);
  }
};
