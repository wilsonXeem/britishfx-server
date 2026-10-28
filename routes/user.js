const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const adminController = require("../controllers/admin");
const auth = require("../middleware/auth");

router.post("/signup", userController.userSignUp);
router.post("/signin", userController.userLogin);
router.post("/refer-signup", userController.referralSignUp);
router.post("/verify", userController.verifyUser);
router.post("/reset/:email", userController.reset);
router.post("/deposit", auth, userController.depositUpdate);
router.post("/withdraw", auth, userController.withdrawalUpdate);
router.post("/info/:id", auth, userController.updateUserInfo);
router.post("/verifyaccount/:email", userController.verifyUserAccount);

// Admin routes — must come before /:id
router.post("/admin", adminController.adminLogin);
router.get("/admin/users", adminController.getUsers);
router.post("/admin/user/:id/account", adminController.updateAccount);
router.post("/admin/user/:id/transaction", adminController.addTransaction);
router.delete("/admin/user/:id/transaction/:code", adminController.deleteTransaction);
router.post("/admin/user/:id/transaction/:code/status", adminController.updateTransactionStatus);
router.post("/admin/user/:id/plan", adminController.updatePlan);
router.post("/admin/user/:id/verify", adminController.toggleVerify);
router.post("/admin/mail", adminController.sendMail);

// Wildcard user fetch — must be last
router.get("/:id", auth, userController.getUser);

module.exports = router;
