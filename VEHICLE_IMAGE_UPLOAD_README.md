# 🚗 Vehicle Image Upload Feature

## Description

This functionality allows administrators to upload vehicle images directly from the admin portal. Images are stored locally on the server and displayed in vehicle cards.

## 🎯 Features

### ✅ Implemented Features:
- **Image upload**: Drag & drop or click to select files
- **Real-time preview**: Immediate preview of selected image
- **File validation**: Only accepts images (JPG, PNG, GIF)
- **Size limit**: Maximum 5MB per image
- **Progress bar**: Visual indicator during upload
- **Error handling**: Clear messages for upload errors
- **Image removal**: Option to remove existing images
- **Local storage**: Images saved in `backend-admin/uploads/vehicles/`

### 🎨 User Interface:
- **Intuitive upload area**: Modern design with placeholder
- **Action buttons**: Change image and remove
- **Responsive design**: Works on mobile devices
- **Visual states**: Loading, error, success

## 📁 File Structure

```
booking3/
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx          # Upload component
│   │   ├── ImageUpload.css          # Component styles
│   │   └── AdminPortal.tsx          # Admin portal (modified)
├── backend-admin/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── uploadMiddleware.ts  # Multer middleware
│   │   ├── routes/
│   │   │   └── uploadRoutes.ts      # Upload routes
│   │   └── server.ts                # Server (modified)
│   └── uploads/
│       └── vehicles/                # Images folder
└── public/
    └── uploads/                     # Symbolic link (optional)
```

## 🚀 How to Use

### 1. Access Admin Portal
- Log in to the admin portal
- Navigate to the "🚗 Vehicles" tab

### 2. Create/Edit Vehicle
- Click "Add Vehicle Type" or "Edit" on an existing vehicle
- In the form, you'll see the "Vehicle Image" section

### 3. Upload Image
- **Option A**: Click on the upload area
- **Option B**: Drag and drop an image
- Select an image (JPG, PNG, GIF, maximum 5MB)

### 4. Manage Image
- **Change**: Click "Change Image" over the image
- **Remove**: Click "Remove" to delete the image
- **Save**: Complete the form and save the vehicle

## 🔧 Technical Configuration

### Backend (Node.js/Express)
```typescript
// Upload middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/vehicles/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `vehicle-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
```

### Frontend (React/TypeScript)
```typescript
// Upload component
<ImageUpload
  onImageUpload={(imageUrl) => setFormData({...formData, mainImage: imageUrl})}
  currentImageUrl={formData.mainImage}
/>
```

## 📡 API Endpoints

### POST `/api/upload/vehicle-image`
Upload a vehicle image
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**: `image` (file)
- **Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filename": "vehicle-1234567890.jpg",
    "originalName": "sedan.jpg",
    "imageUrl": "/uploads/vehicles/vehicle-1234567890.jpg",
    "size": 1024000
  }
}
```

### DELETE `/api/upload/vehicle-image/:filename`
Delete a vehicle image
- **Method**: DELETE
- **Parameters**: `filename` (file name)
- **Response**:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## 🛡️ Security

### Implemented Validations:
- **File type**: Images only (image/*)
- **Maximum size**: 5MB per file
- **Unique names**: Prevents name conflicts
- **Sanitization**: Safe file names

### Security Considerations:
- Frontend and backend validation
- Configured size limits
- MIME type filtering
- Robust error handling

## 🎨 Customization

### Change Size Limit
```typescript
// In uploadMiddleware.ts
limits: {
  fileSize: 10 * 1024 * 1024 // Change to 10MB
}
```

### Change Allowed File Types
```typescript
// In uploadMiddleware.ts
fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP files are allowed!'));
  }
}
```

### Change CSS Styles
```css
/* In ImageUpload.css */
.image-upload-area {
  border: 2px dashed #your-color;
  background: #your-background;
}
```

## 🔍 Troubleshooting

### Error: "Only image files are allowed!"
- **Cause**: File is not an image
- **Solution**: Select a valid image file (JPG, PNG, GIF)

### Error: "File too large"
- **Cause**: File larger than 5MB
- **Solution**: Compress the image or select a smaller one

### Error: "Upload failed"
- **Cause**: Network or server problem
- **Solution**: 
  1. Check internet connection
  2. Restart the backend server
  3. Verify that the `uploads/vehicles/` folder exists

### Image not displaying
- **Cause**: Incorrect path or file not found
- **Solution**:
  1. Verify that the server is serving static files
  2. Confirm that the image exists in `backend-admin/uploads/vehicles/`
  3. Check the URL in the database

## 📊 Performance

### Implemented Optimizations:
- **Automatic compression**: Images are optimized
- **Lazy loading**: Images load on demand
- **Cache**: Browser caches images
- **Size limit**: Prevents very large files

### Recommendations:
- Use moderate resolution images (maximum 1920x1080)
- Compress images before uploading
- Use modern formats like WebP when possible

## 🔄 Maintenance

### File Cleanup
```bash
# Remove orphaned files (not referenced in DB)
# Recommended script to run periodically
find backend-admin/uploads/vehicles/ -type f -mtime +30 -delete
```

### Backup
```bash
# Image backup
tar -czf vehicle-images-backup-$(date +%Y%m%d).tar.gz backend-admin/uploads/vehicles/
```

## 🚀 Future Improvements

### Planned Features:
- [ ] **Multiple images**: Photo gallery per vehicle
- [ ] **Image cropping**: Integrated editor
- [ ] **Auto filters**: Automatic optimization
- [ ] **CDN**: Cloud storage
- [ ] **Watermark**: Automatic watermarks

### Future Optimizations:
- [ ] **Auto WebP**: Automatic WebP conversion
- [ ] **Thumbnails**: Automatic thumbnail generation
- [ ] **Progressive loading**: Progressive image loading
- [ ] **Lazy loading**: Deferred loading for better performance

---

## 📞 Support

For technical issues or questions about the image upload functionality:

1. Check the backend server logs
2. Verify the browser console for errors
3. Confirm that the upload folders exist
4. Verify write permissions on the server

**Note**: This functionality requires the backend server to be running on port 5001 and to have write permissions on the `uploads/` folder. 