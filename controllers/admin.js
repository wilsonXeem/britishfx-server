const error = require("../util/error-handler");
const Transactions = require("../models/transactions");
const User = require("../models/user");
const { userExist } = require("../util/finder");
const nodemailer = require("nodemailer");

const getTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE !== "false",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const letterheadTemplate = (subject, body, cta = null) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Letterhead header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0A1628 0%,#0F1E35 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
              <tr>
                <td style="width:36px;height:36px;background:#C9A84C;border-radius:8px;text-align:center;vertical-align:middle;font-size:18px;color:#0A1628;font-weight:bold;">&#9650;</td>
                <td style="padding-left:10px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:0.04em;vertical-align:middle;">CRESTMONT APEX</td>
              </tr>
            </table>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.45);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Investment Platform</p>
          </td>
        </tr>
        <!-- Gold divider -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#C9A84C,#e8c96a,#C9A84C);"></td></tr>
        <!-- Subject bar -->
        <tr>
          <td style="background:#ffffff;padding:24px 40px 0;">
            <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Subject</p>
            <h2 style="margin:6px 0 0;font-size:20px;color:#0A1628;font-weight:700;">${subject}</h2>
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;margin:20px 0;"></td></tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:0 40px ${cta ? "24px" : "32px"};">
            <div style="font-size:15px;line-height:1.8;color:#333;white-space:pre-wrap;">${body}</div>
            ${cta ? `<div style="text-align:center;margin-top:28px;"><a href="${cta.url}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#e8c96a);color:#0A1628;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.02em;">${cta.label}</a></div>` : ""}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0A1628;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#C9A84C;font-size:13px;font-weight:600;">Crestmont Apex Investment Platform</p>
            <p style="margin:0;color:rgba(255,255,255,0.35);font-size:11px;">info@crestmontapex.us &nbsp;|&nbsp; This is an official communication</p>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.2);font-size:10px;">© ${new Date().getFullYear()} Crestmont Apex. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* Send verification email to a user */
module.exports.sendVerificationEmail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: user.email,
      subject: "Verify Your Crestmont Apex Account",
      html: letterheadTemplate(
        "Verify Your Account",
        `Dear ${user.username},\n\nThank you for registering with Crestmont Apex. Your account is ready — please click the button below to verify your email address and activate your account.\n\nIf you did not create this account, please ignore this email.`,
        { label: "Verify My Account", url: `https://crestmontapex.us/login/${user.email}` }
      ),
    });
    res.status(200).json({ type: "ok", message: "Verification email sent" });
  } catch (err) {
    console.error("Verification mail error:", err.message);
    res.status(500).json({ message: err.message, type: "error" });
  }
};
module.exports.sendMail = async (req, res, next) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) return res.status(400).json({ message: "Missing fields", type: "error" });
  try {
    const recipients = to === "all"
      ? (await User.find({}, "email").exec()).map(u => u.email)
      : [to];
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: recipients.join(","),
      subject,
      html: letterheadTemplate(subject, body),
    });
    res.status(200).json({ type: "ok", message: `Mail sent to ${recipients.length} recipient(s)` });
  } catch (err) {
    console.error("Mail error:", err.message);
    res.status(500).json({ message: err.message, type: "error" });
  }
};

module.exports.adminLogin = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid credentials", type: "error" });
    }
    const users = await User.find().exec();
    res.status(200).json({ message: "Admin log in successful", type: "admin", users });
  } catch (err) {
    error.error(err, next);
  }
};

/* Get all users */
module.exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().exec();
    res.status(200).json({ type: "users", users });
  } catch (err) {
    error.error(err, next);
  }
};

/* Update account balances directly */
module.exports.updateAccount = async (req, res, next) => {
  const { id } = req.params;
  const { balance, deposit, earnings, withdrawal, referralBonus } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return error.errorHandler(res, "User not found", "user");
    if (balance !== undefined) user.account.balance = Number(balance);
    if (deposit !== undefined) user.account.deposit = Number(deposit);
    if (earnings !== undefined) user.account.earnings = Number(earnings);
    if (withdrawal !== undefined) user.account.withdrawal = Number(withdrawal);
    if (referralBonus !== undefined) user.account.referralBonus = Number(referralBonus);
    await user.save();
    res.status(200).json({ type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Add a backdated transaction */
module.exports.addTransaction = async (req, res, next) => {
  const { id } = req.params;
  const { transactionType, amount, modeOfPayment, status, dateOfTrans } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return error.errorHandler(res, "User not found", "user");
    const numGen = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const entry = {
      referrenceCode: String(numGen),
      amount: Number(amount),
      modeOfPayment,
      status: status || "success",
      dateOfTrans: dateOfTrans || new Date().toLocaleDateString(),
      username: user.username,
      email: user.email,
      userId: user._id,
    };
    if (transactionType === "deposit") {
      user.transactions.deposit.unshift(entry);
    } else {
      user.transactions.withdrawal.unshift(entry);
    }
    user.transactions.allTransactions.unshift({
      referrenceCode: entry.referrenceCode,
      amount: entry.amount,
      modeOfPayment,
      transactionType,
      status: entry.status,
      dateOfTrans: entry.dateOfTrans,
    });
    await user.save();
    res.status(200).json({ type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Delete a transaction by referenceCode */
module.exports.deleteTransaction = async (req, res, next) => {
  const { id, code } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return error.errorHandler(res, "User not found", "user");
    user.transactions.deposit = user.transactions.deposit.filter(t => t.referrenceCode !== code);
    user.transactions.withdrawal = user.transactions.withdrawal.filter(t => t.referrenceCode !== code);
    user.transactions.allTransactions = user.transactions.allTransactions.filter(t => t.referrenceCode !== code);
    await user.save();
    res.status(200).json({ type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Update transaction status */
module.exports.updateTransactionStatus = async (req, res, next) => {
  const { id, code } = req.params;
  const { status } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return error.errorHandler(res, "User not found", "user");
    const dep = user.transactions.deposit.find(t => t.referrenceCode === code);
    if (dep) dep.status = status;
    const wit = user.transactions.withdrawal.find(t => t.referrenceCode === code);
    if (wit) wit.status = status;
    const all = user.transactions.allTransactions.find(t => t.referrenceCode === code);
    if (all) all.status = status;
    await user.save();
    res.status(200).json({ type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Change investment plan */
module.exports.updatePlan = async (req, res, next) => {
  const { id } = req.params;
  const { plan } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return error.errorHandler(res, "User not found", "user");
    user.investmentPlan = plan;
    await user.save();
    res.status(200).json({ type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};

/* Toggle account verification */
module.exports.toggleVerify = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return error.errorHandler(res, "User not found", "user");
    user.verified = !user.verified;
    await user.save();
    res.status(200).json({ type: "user", user });
  } catch (err) {
    error.error(err, next);
  }
};
