import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const imageUploadInterceptor = FileFieldsInterceptor(
  [
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ],
  {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only images allowed'), false);
      }
    },
  }
);





export const CategoryImageUploadInterceptor = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'), false);
    }
  },
});