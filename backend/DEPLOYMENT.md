# Render Deployment Guide

## Steps to Deploy on Render:

### 1. Prepare Repository
- Push your code to GitHub/GitLab
- Make sure all files are committed

### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub/GitLab

### 3. Create New Web Service
- Click "New +" → "Web Service"
- Connect your repository
- Select the backend folder (if monorepo)

### 4. Configure Service
- **Name**: MegaHealth-backend
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or paid for better performance)

### 5. Environment Variables
Add these in Render dashboard:

```
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-frontend-url.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
GEOAPIFY_API_KEY=your_geoapify_api_key
```

### 6. Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Your API will be available at: `https://your-app-name.onrender.com`

## Important Notes:
- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- For production, consider paid plans
- Update CORS origins with your deployed frontend URL

## Testing Deployment:
Visit: `https://your-app-name.onrender.com/`
Should return: `{"message": "MegaHealth API is running"}`