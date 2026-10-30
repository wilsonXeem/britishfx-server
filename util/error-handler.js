module.exports = {
  error: (err, next) => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  },
  errorHandler: (res, message, type = "") => {
    res.status(400).json({ error: "error", message, type });
    throw new Error(message);
  },
  validationError: (err, res, type = "") => {
    if (!err.isEmpty()) {
      const message = err.array()[0].msg;
      type = err.array()[0].param;
      res.status(400).json({ error: message, type });
      throw new Error(message);
    }
  },
};
