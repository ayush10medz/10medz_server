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

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",");
    err.message = `Duplicate field - ${error}`;
    err.statusCode = 400;
  }

  // Handle MongoDB cast errors (invalid IDs, etc)
  if (err.name === "CastError") {
    err.message = `Invalid Format of ${err.path}`;
    err.statusCode = 400;
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(val => val.message);
    err.message = `Invalid input: ${errors.join(', ')}`;
    err.statusCode = 400;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    err.message = "Invalid token. Please login again";
    err.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    err.message = "Token expired. Please login again";
    err.statusCode = 401;
  }

  // Handle file upload errors
  if (err.name === "MulterError") {
    err.message = "File upload error: " + err.message;
    err.statusCode = 400;
  }

  // Log error for debugging
  console.error(`[Error] ${err.message}`, {
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request') {
    return new ErrorHandler(message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ErrorHandler(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ErrorHandler(message, 403);
  }

  static notFound(message = 'Not Found') {
    return new ErrorHandler(message, 404);
  }

  static validationError(message = 'Validation Error') {
    return new ErrorHandler(message, 400);
  }

  static serverError(message = 'Internal Server Error') {
    return new ErrorHandler(message, 500);
  }
}

export { ErrorHandler }

