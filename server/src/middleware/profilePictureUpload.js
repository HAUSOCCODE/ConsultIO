import multer from "multer";
import path from "node:path";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const hasValidSignature = (file) => {
  const buffer = file?.buffer;
  if (!buffer?.length) return false;
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg")
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (file.mimetype === "image/png")
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    );
  if (file.mimetype === "image/webp")
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  return false;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      !allowedExtensions.has(extension) ||
      !allowedMimeTypes.has(file.mimetype.toLowerCase())
    )
      return callback(new Error("UNSUPPORTED_PROFILE_IMAGE"));
    callback(null, true);
  },
}).single("photo");

export const profilePictureUpload = (req, res, next) => {
  upload(req, res, (error) => {
    if (error?.message === "UNSUPPORTED_PROFILE_IMAGE")
      return res
        .status(400)
        .json({ message: "Please select a valid image file." });
    if (error?.code === "LIMIT_FILE_SIZE")
      return res
        .status(400)
        .json({ message: "Profile picture must be 5 MB or smaller." });
    if (error?.code === "LIMIT_UNEXPECTED_FILE")
      return res
        .status(400)
        .json({ message: "Please select a valid image file." });
    if (error) return next(error);
    if (req.file && !hasValidSignature(req.file))
      return res
        .status(400)
        .json({ message: "Please select a valid image file." });
    next();
  });
};
