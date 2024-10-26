import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key:process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function uploadonCloudinary(
  filepath: string
): Promise<string | undefined> {
  try {
    console.log("Cloudinary Config:", process.env.CLOUDINARY_CLOUD_NAME);

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(filepath, {
      upload_preset: "profile",
      resource_type: "auto",
    });

    console.log("Upload result:", result);

    // Return the secure URL of the uploaded file
    return result.secure_url; // Correct field to use
  } catch (error) {
    console.error("Error while uploading on Cloudinary", error);
    return undefined; // Explicitly return undefined in case of an error
  }
}

export { uploadonCloudinary };
