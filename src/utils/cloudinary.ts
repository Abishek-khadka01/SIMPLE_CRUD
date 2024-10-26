import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:"dqxgd04uv",
  api_key: "378918772337162",
  api_secret: "mx0JLeH3cv0OnT4rDeVW3BG1VQg",
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
