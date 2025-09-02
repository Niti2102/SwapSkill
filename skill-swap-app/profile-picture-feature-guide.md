# Profile Picture Feature Guide

## Overview
The profile picture feature allows users to upload, display, update, and delete their profile pictures throughout the SkillSwap application.

## Features Implemented

### Backend (API)
1. **User Model Updates**
   - Added `profilePicture` field to store image filename
   - Field is optional with default value of `null`

2. **File Upload Configuration**
   - Uses Multer middleware for handling multipart/form-data
   - Images stored in `/uploads/profile-pictures/` directory
   - File naming: `{userId}_{timestamp}_{random}.{extension}`
   - File size limit: 5MB
   - Allowed formats: All image types (image/*)

3. **API Endpoints**
   ```
   POST /api/users/profile-picture - Upload profile picture (Protected)
   GET /api/users/profile-picture/:filename - Get profile picture (Public)
   DELETE /api/users/profile-picture - Delete profile picture (Protected)
   ```

4. **Static File Serving**
   - Profile pictures served from `/uploads` route
   - Accessible via: `http://localhost:3000/uploads/profile-pictures/{filename}`

### Frontend (React)
1. **Profile Component**
   - Image upload with drag-and-drop interface
   - Image preview before upload
   - Upload progress indication
   - Delete functionality
   - Fallback to user initials if no picture

2. **Navbar Integration**
   - Small profile picture displayed next to Profile link
   - Fallback to user initials if no picture
   - Responsive design

3. **Image Handling**
   - Client-side file validation
   - Image preview functionality
   - Error handling with toast notifications
   - Loading states for better UX

## Usage Instructions

### For Users
1. **Upload Profile Picture**
   - Go to Profile page
   - Click "Select Image" button
   - Choose an image file (max 5MB)
   - Click "Upload" to save
   - Image appears immediately in profile

2. **Delete Profile Picture**
   - Go to Profile page
   - Click "Delete" button (only visible if picture exists)
   - Confirm deletion
   - Reverts to default user icon

### For Developers
1. **Setup Requirements**
   ```bash
   cd backend
   npm install multer
   ```

2. **File Structure**
   ```
   backend/
   ├── config/
   │   └── multer.js        # Upload configuration
   ├── uploads/
   │   └── profile-pictures/  # Image storage
   ├── routes/
   │   └── users.js         # API endpoints
   └── server.js            # Static file serving
   ```

3. **Environment Setup**
   - Ensure `uploads` directory has write permissions
   - Configure file size limits in multer config
   - Set up proper CORS for file uploads

## API Reference

### Upload Profile Picture
```javascript
POST /api/users/profile-picture
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body: {
  profilePicture: File
}

Response: {
  message: "Profile picture uploaded successfully",
  user: { ...userObject },
  profilePictureUrl: "/api/users/profile-picture/filename.jpg"
}
```

### Get Profile Picture
```javascript
GET /api/users/profile-picture/:filename

Response: Image file (JPEG, PNG, etc.)
```

### Delete Profile Picture
```javascript
DELETE /api/users/profile-picture
Authorization: Bearer {token}

Response: {
  message: "Profile picture deleted successfully",
  user: { ...userObject }
}
```

## Integration Points

1. **Authentication Context**
   - User object now includes `profilePicture` field
   - Auth responses include profile picture data
   - Profile updates sync with context

2. **Other Components**
   - Navbar displays mini profile picture
   - Easy to extend to other components (Swipe cards, Chat, etc.)
   - Consistent fallback handling

## Security Features

1. **File Validation**
   - MIME type checking (images only)
   - File size limits (5MB)
   - Secure filename generation

2. **Access Control**
   - Upload/Delete require authentication
   - File serving is public (for display purposes)
   - User can only modify their own picture

3. **File Management**
   - Automatic cleanup of old files on update
   - Unique filenames prevent conflicts
   - Organized storage structure

## Troubleshooting

### Common Issues
1. **"No file uploaded" error**
   - Ensure form has `enctype="multipart/form-data"`
   - Check file input has correct name attribute
   - Verify file is actually selected

2. **"File size too large" error**
   - Current limit is 5MB
   - Adjust in `config/multer.js` if needed
   - Add client-side validation for better UX

3. **Images not displaying**
   - Check if uploads directory exists
   - Verify static file serving is configured
   - Check file permissions

4. **Upload fails**
   - Verify multer dependency is installed
   - Check server logs for specific errors
   - Ensure authentication token is valid

### Development Tips
1. Always handle both success and error cases
2. Provide loading states for better UX
3. Include fallback images/initials
4. Test with various image formats and sizes
5. Consider implementing image resizing for optimization

## Future Enhancements
1. Image compression/resizing
2. Multiple image formats support
3. Drag-and-drop upload interface
4. Crop functionality
5. Cloud storage integration (AWS S3, Cloudinary)
6. Bulk upload capabilities
7. Image optimization and WebP conversion