export const notFound = (_req, res) =>
  res.status(404).json({ message: "Route not found." });

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 11000)
    return res
      .status(409)
      .json({ message: "An account with those details already exists." });
  res.status(500).json({ message: "An unexpected server error occurred." });
};
