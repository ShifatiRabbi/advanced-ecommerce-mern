import { v2 as cloudinary } from 'cloudinary';
import multerStorageCloudinary from 'multer-storage-cloudinary';
// const { CloudinaryStorage } = multerStorageCloudinary;
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

const makeStorage = (folder) =>
  new multerStorageCloudinary.CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
  });

export const productUpload  = multer({ storage: makeStorage('products'),   limits: { fileSize: 5 * 1024 * 1024 } });
export const categoryUpload = multer({ storage: makeStorage('categories'), limits: { fileSize: 2 * 1024 * 1024 } });
export const brandUpload    = multer({ storage: makeStorage('brands'),     limits: { fileSize: 2 * 1024 * 1024 } });
export const blogUpload     = multer({ storage: makeStorage('blog'),      limits: { fileSize: 3 * 1024 * 1024 } });