# Railway Deployment Setup

## Environment Variables

### Frontend App (mrdk)

Set these environment variables in Railway for the frontend service:

```bash
# Required: Backend URL for loading images and files
VITE_BACKEND_URL=https://your-server-domain.up.railway.app

# Required: API URL for data requests
VITE_API_URL=https://your-server-domain.up.railway.app/api

# Optional: Build and deployment settings
NODE_ENV=production
```

### Backend App (server)

Set these environment variables in Railway for the backend service:

```bash
# Required: JWT secret for authentication
JWT_SECRET=your-strong-random-secret-here

# Required: Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Required: CORS origins (frontend URL)
CORS_ORIGIN=https://your-frontend-domain.up.railway.app

# Optional: Server settings
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Optional: Cookie settings for production
COOKIE_SAMESITE=lax
```

## Quick Setup Steps

1. Deploy backend first and note the URL (e.g., `https://server-xyz.up.railway.app`)
2. Set backend environment variables
3. Deploy frontend with backend URL in `VITE_BACKEND_URL` and `VITE_API_URL`
4. Verify images load correctly by checking Network tab in browser DevTools

## Troubleshooting

**Images not loading?**
- Check `VITE_BACKEND_URL` is set correctly on frontend
- Verify backend is accessible at that URL
- Check browser console for CORS errors
- Ensure backend has frontend URL in `CORS_ORIGIN`

**API requests failing?**
- Verify `VITE_API_URL` matches backend URL + `/api`
- Check `CORS_ORIGIN` on backend includes frontend URL
- Verify JWT_SECRET is set on backend
