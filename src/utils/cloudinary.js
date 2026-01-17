import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64String - Base64 encoded image string
 * @param {string} folder - Cloudinary folder name (default: 'payment-slips')
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export const uploadBase64Image = async (base64String, folder = 'payment-slips') => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64String, {
      folder: `iot-store/${folder}`, // Changed to include parent folder
      resource_type: 'auto',
      transformation: [
        { width: 1200, crop: 'limit' }, // Limit max width to 1200px
        { quality: 'auto:good' }, // Auto optimize quality
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<boolean>}
 */
export const deleteCloudinaryImage = async (imageUrl) => {
  try {
    // Extract public_id from URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/iot-store/payment-slips/abc123.jpg
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    // Get everything after 'upload/v{version}/'
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    // Remove file extension
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

export default {
  uploadBase64Image,
  deleteCloudinaryImage,
};
