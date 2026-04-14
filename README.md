# AuthCore

AuthCore is a full-stack authentication demo with a React frontend and an Express/MongoDB backend. It supports registration with email OTP verification, password login, OTP login, password reset, session tracking, logout from one or all devices, CSRF protection, and cookie-based auth.

## Project Structure

- `frontend/`: React + Vite UI
- `backend/`: Express API + MongoDB models/controllers/middleware

## Features

- Email/password registration
- OTP-based email verification
- Login with password
- Login with OTP
- Forgot password and reset password
- Access/refresh token flow with cookies
- Session listing and single-session revoke
- Logout current device or all devices
- CSRF protection for non-GET requests
- Rate limiting and audit logging
- Swagger/OpenAPI docs at `/api-docs`

## Backend Setup

Create `backend/.env` with values like:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/authcore
ACCESS_TOKEN_SECRET=change-me-access
REFRESH_TOKEN_SECRET=change-me-refresh
EMAIL_HOST=smtp.example.com
EMAIL_USER=your-user
EMAIL_PASS=your-password
EMAIL_FROM=no-reply@example.com
FRONTEND_URL=http://localhost:5173
```

Install and run:

```bash
cd backend
npm install
npm run dev
```

## Frontend Setup

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Install and run:

```bash
cd frontend
npm install
npm run dev
```

## API Docs

After the backend is running:

- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`
- CSRF token route: `http://localhost:5000/api/csrf-token`

## Frontend and Backend Integration

Yes, you can test most backend flows directly through the frontend.

- Register, verify OTP, login, login with OTP, forgot password, reset password, logout, logout all devices, and session listing can all be exercised from the UI.
- Single-session revoke is available from the Sessions screen for non-current sessions.

Postman is still useful for:

- testing routes that the UI does not expose, like `/api/v1/auth/admin`
- checking exact request/response payloads and headers
- debugging cookies, refresh flow, and failure cases
- testing APIs before the frontend is finished

For this project, the frontend is enough for normal end-to-end user-flow testing, while Postman is better for API-level verification.

## Current Verification Notes

- The backend had a syntax error in `auth.middleware.js`; that has been fixed.
- Cookie-based frontend auth also needs CORS with credentials, which is now configured.
- Swagger docs are generated from a local OpenAPI document and served by the backend without extra packages.
- The frontend production build was verified successfully after installing dependencies.

## Suggested Test Flow

1. Start MongoDB
2. Start the backend
3. Start the frontend
4. Register a user
5. Verify registration OTP from email
6. Login with password
7. Open Sessions page
8. Login from another browser/device and verify multiple sessions
9. Revoke one session or logout all devices

## Main Routes

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Auth base: `http://localhost:5000/api/v1/auth`
