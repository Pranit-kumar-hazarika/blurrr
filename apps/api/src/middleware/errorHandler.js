function notFound(req, res) {
  res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number(err.status) || (err.name === "MulterError" ? 400 : 500);
  const message = status >= 500 ? "An unexpected server error occurred." : err.message;
  if (process.env.NODE_ENV !== "production") {
    console.error("[api-error]", err.message);
  } else if (status >= 500) {
    console.error("[api-error] Internal server error");
  }
  res.status(status).json({ error: message, code: err.code || "REQUEST_FAILED" });
}

module.exports = { notFound, errorHandler };
