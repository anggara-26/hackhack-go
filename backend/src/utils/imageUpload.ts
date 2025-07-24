import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads", "artifacts");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage (we'll process and save manually)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)"), false);
  }
};

// Configure multer
export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Process and save uploaded image
 */
export const processAndSaveImage = async (
  buffer: Buffer,
  originalFilename: string
): Promise<{ filePath: string; fileName: string }> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(originalFilename).toLowerCase() || ".jpg";
    const fileName = `artifact_${timestamp}_${randomString}${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Process image with Sharp (resize and optimize)
    await sharp(buffer)
      .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(filePath);

    return {
      filePath,
      fileName,
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Failed to process image");
  }
};

/**
 * Get image URL for serving
 */
export const getImageUrl = (fileName: string): string => {
  return `/api/artifacts/images/${fileName}`;
};

/**
 * Delete image file
 */
export const deleteImage = async (fileName: string): Promise<void> => {
  try {
    const filePath = path.join(uploadsDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

/**
 * Get full image path
 */
export const getImagePath = (fileName: string): string => {
  return path.join(uploadsDir, fileName);
};
