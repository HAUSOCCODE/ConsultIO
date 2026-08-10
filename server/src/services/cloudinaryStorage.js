import cloudinary from "../config/cloudinary.js";

export const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        unique_filename: true,
        overwrite: false,
        ...options,
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });

export async function destroyAsset(asset) {
  if (!asset?.publicId) return;
  await cloudinary.uploader.destroy(asset.publicId, {
    resource_type: asset.resourceType || "image",
    invalidate: true,
  });
}

export const cloudinaryReference = (result) => ({
  url: result.secure_url,
  publicId: result.public_id,
  resourceType: result.resource_type,
});
