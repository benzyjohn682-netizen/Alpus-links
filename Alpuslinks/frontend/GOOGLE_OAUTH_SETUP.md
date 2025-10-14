# Google OAuth Setup Guide

## Frontend Configuration

1. Create a `.env.local` file in the frontend directory with the following variables:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Backend Configuration

1. Create a `.env` file in the backend directory with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/your_database_name

# Email Configuration (optional)
FRONTEND_URL=http://localhost:3000
```

## Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Choose "Web application" as the application type
7. Add your domain to "Authorized JavaScript origins":
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
8. Add your redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
9. Copy the Client ID and use it in your environment variables

## Testing

1. Start the backend server: `cd backend && npm start`
2. Start the frontend development server: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3000`
4. Try logging in with Google OAuth

## Troubleshooting

- Make sure the Google Client ID is correctly set in both frontend and backend
- Ensure the domain is added to authorized origins in Google Cloud Console
- Check browser console for any JavaScript errors
- Verify that the backend is running and accessible
