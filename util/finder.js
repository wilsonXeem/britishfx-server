const User = require("../models/user");

const error = require("./error-handler");

module.exports = {
  userExist: async (type, value) => {
    let user;

    switch (type) {
      case "id":
        user = await User.findById(value);
        return user;

      case "email":
        if (value === "")
          error.errorHandler(res, "Email input is empty", "email");
        user = await User.findOne({ email: value });
        return user;
    }
  },
};
