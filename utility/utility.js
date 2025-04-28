export const TryCatch = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Error handling middleware
export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;

    if (err.code === 11000) {
        const error = object.key(err.keyPattern).join(",")
        err.message = `Duplicate field - ${error}`;
        err.statusCode = 400
    }

    if (err.name === "CastError") {
        err.message = `Invalid Format of ${err.path}`,
            err.statusCode = 400
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};



class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

export { ErrorHandler }

