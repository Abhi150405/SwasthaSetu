import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

// Init GCS client
const storage = new Storage({
  keyFilename: path.resolve(process.env.GCS_KEY_FILE),
  projectId: process.env.GCS_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// ✅ Upload File to GCS
const uploadOnGCS = async (localFilePath, folder = "PatientDocuments") => {
  if (!localFilePath) return null;

  try {
    const destination = `${folder}/${Date.now()}-${path.basename(localFilePath)}`;

    await bucket.upload(localFilePath, {
      destination,
      resumable: false,
      gzip: true,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    // Delete local temp file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Local temp file deleted:", localFilePath);
    }

    // GCS format URL
    const gcsUrl = `gs://${bucketName}/${destination}`;
    console.log("File uploaded on GCS:", gcsUrl);

    return { secure_url: gcsUrl };

  } catch (err) {
    console.log("GCS upload error:", err);

    // Delete temp file on error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Local temp file deleted after failure:", localFilePath);
    }

    return null;
  }
};



// ✅ Extract GCS object path from URL
const getPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;
    const parts = url.split(`${bucketName}/`); 
    return parts[1] || null; // e.g., "uploads/12345-file.pdf"
  } catch (error) {
    console.log("Error extracting GCS public id:", error);
    return null;
  }
};

// ✅ Delete File from GCS
const deleteFromGCS = async (publicId) => {
  try {
    if (!publicId) return null;

    await bucket.file(publicId).delete();
    console.log("File deleted from GCS");
    return true;
  } catch (err) {
    console.log("GCS delete error:", err);
    return null;
  }
};

export {
  uploadOnGCS,
  getPublicIdFromUrl,
  deleteFromGCS
};
