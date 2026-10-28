/**
 * Crestmont Apex — Database Seed Script
 *
 * Creates:
 *   1. A test investor account (Silver plan, verified, with realistic transaction history)
 *   2. Confirms admin credentials from .env are set
 *
 * Usage:  node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/user");
const Transactions = require("./models/transactions");

/* ── Helpers ── */
const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-US");
};
const ref = () => String(Math.floor(Math.random() * 900000000) + 100000000);

/* ── Seed data ── */
const TEST_USER = {
  username:       "testinvestor",
  email:          "investor@crestmontapex.com",
  password:       "Test@1234",        // plain — will be hashed
  fullname:       "Alex Morgan",
  mobile:         "+1 312 555 0198",
  country:        "United States",
  investmentPlan: "silver",
  verified:       true,
  account: {
    deposit:       10000,
    earnings:      4500,
    withdrawal:    1500,
    balance:       13000,
    referralBonus: 500,
  },
};

async function seed() {
  /* ── Connect ── */
  await mongoose.connect(process.env.MONGODB);
  console.log("✅  Connected to MongoDB:", process.env.MONGODB);

  /* ── Clean previous seed data ── */
  await User.deleteOne({ email: TEST_USER.email });
  await Transactions.deleteMany({ email: TEST_USER.email });
  console.log("🗑   Cleared previous seed records");

  /* ── Hash password ── */
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);

  /* ── Build transaction arrays ── */
  const dep1 = {
    referrenceCode:  ref(),
    transactionType: "deposit",
    amount:          10000,
    modeOfPayment:   "Bitcoin",
    status:          "success",
    dateOfTrans:     daysAgo(30),
    username:        TEST_USER.username,
    email:           TEST_USER.email,
  };

  const dep2 = {
    referrenceCode:  ref(),
    transactionType: "deposit",
    amount:          3000,
    modeOfPayment:   "Ethereum",
    status:          "pending",
    dateOfTrans:     daysAgo(2),
    username:        TEST_USER.username,
    email:           TEST_USER.email,
  };

  const wit1 = {
    referrenceCode:  ref(),
    transactionType: "withdrawal",
    amount:          1500,
    modeOfPayment:   "Bitcoin",
    status:          "success",
    dateOfTrans:     daysAgo(10),
    username:        TEST_USER.username,
    email:           TEST_USER.email,
  };

  /* ── Create user ── */
  const user = new User({
    username:       TEST_USER.username,
    email:          TEST_USER.email,
    password:       hashedPassword,
    fullname:       TEST_USER.fullname,
    mobile:         TEST_USER.mobile,
    country:        TEST_USER.country,
    investmentPlan: TEST_USER.investmentPlan,
    verified:       TEST_USER.verified,
    btc:            "bc1q_placeholder_wallet",
    wallet:         "0x_placeholder_wallet",
    nkName:         "Jamie Morgan",
    nkMobile:       "+1 312 555 0199",
    account:        TEST_USER.account,
    transactions: {
      deposit:     [dep1, dep2],
      withdrawal:  [wit1],
      earnings:    ["No transactions yet"],
      allTransactions: [
        { ...dep1 },
        { ...wit1 },
        { ...dep2 },
      ],
    },
    referral: [
      { email: "friend1@example.com", plan: "bronze", dateJoined: daysAgo(20) },
      { email: "friend2@example.com", plan: "silver", dateJoined: daysAgo(8)  },
    ],
  });

  const savedUser = await user.save();
  console.log("👤  Test user created:", savedUser._id.toString());

  /* ── Seed Transactions collection (used by admin panel) ── */
  await Transactions.insertMany([
    { ...dep1, userId: savedUser._id.toString() },
    { ...dep2, userId: savedUser._id.toString() },
    { ...wit1, userId: savedUser._id.toString() },
  ]);
  console.log("💳  Transactions seeded (3 records)");

  /* ── Print summary ── */
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SEED COMPLETE — Login Credentials");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n  🧑‍💼  TEST INVESTOR ACCOUNT");
  console.log(`      Email    : ${TEST_USER.email}`);
  console.log(`      Password : ${TEST_USER.password}`);
  console.log(`      Plan     : Silver (15% weekly ROI)`);
  console.log(`      Balance  : $${TEST_USER.account.balance.toLocaleString()}`);
  console.log(`      Verified : Yes`);
  console.log("\n  🔐  ADMIN ACCOUNT (server .env credentials)");
  console.log(`      Username : ${process.env.ADMIN_USERNAME || "⚠️  ADMIN_USERNAME not set in .env"}`);
  console.log(`      Password : ${process.env.ADMIN_PASSWORD || "⚠️  ADMIN_PASSWORD not set in .env"}`);
  console.log(`      URL      : http://localhost:3000/admin/admin`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
  console.log("🔌  Disconnected. Done.");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
