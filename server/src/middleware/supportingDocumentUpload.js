import multer from "multer";
import path from "node:path";

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".mp4",
  ".webm",
]);
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/csv",
  "video/mp4",
  "video/webm",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      !allowedExtensions.has(extension) ||
      !allowedMimeTypes.has(file.mimetype.toLowerCase())
    )
      return callback(new Error("UNSUPPORTED_FILE_TYPE"));
    callback(null, true);
  },
}).array("documents", 5);

export const supportingDocumentUpload = (req, res, next) => {
  upload(req, res, (error) => {
    if (error?.message === "UNSUPPORTED_FILE_TYPE")
      return res
        .status(400)
        .json({ message: "This file type is not supported." });
    if (error?.code === "LIMIT_FILE_SIZE")
      return res
        .status(400)
        .json({ message: "Each supporting file must be 10 MB or smaller." });
    if (["LIMIT_FILE_COUNT", "LIMIT_UNEXPECTED_FILE"].includes(error?.code))
      return res
        .status(400)
        .json({ message: "You may upload a maximum of 5 supporting files." });
    if (error) return next(error);
    const totalSize = (req.files || []).reduce(
      (total, file) => total + file.size,
      0,
    );
    if (totalSize > 25 * 1024 * 1024)
      return res.status(400).json({
        message: "Supporting documents must not exceed 25 MB in total.",
      });
    next();
  });
};
