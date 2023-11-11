const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const adminController = require("../controllers/admin")

router.post("/signup", userController.userSignUp);
router.post("/signin", userController.userLogin);
router.post("/refer-signup", userController.referralSignUp);
router.get("/:id", userController.getUser);
router.post("/verify", userController.verifyUser);
router.post("/reset/:email", userController.reset);
router.post("/deposit", userController.depositUpdate);
router.post("/withdraw", userController.withdrawalUpdate);
router.post("/info/:id", userController.updateUserInfo);
router.post("/verifyaccount/:email", userController.verifyUserAccount)

router.post("/admin", adminController.adminLogin)
router.post("/deposit/:id", adminController.verifyDeposit)
router.post("/withdraw/:id", adminController.verifyWithdrawal);

module.exports = router;
