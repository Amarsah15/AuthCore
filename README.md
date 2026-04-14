# AuthCore

> Security-first authentication with OTP flows, session tracking, CSRF-aware requests, and a polished React experience.

AuthCore is a full-stack authentication app built with a React frontend and an Express + MongoDB backend. It is designed around modern auth flows: registration with email verification, password and OTP login, reset-password flows, protected sessions, and device visibility.

## Live Demo

[https://authcore-rose.vercel.app](https://authcore-rose.vercel.app)

## Why AuthCore

AuthCore is built to feel like a real product, not just a basic auth demo. The project focuses on secure defaults, clean UX, and production-style account flows.

- Email OTP verification for registration
- Password login and OTP login
- Password reset with OTP
- Session visibility and single-device revoke
- Logout current device or all devices
- CSRF-aware API requests with cookies
- Rate limiting and audit logging
- OpenAPI docs for backend routes
- Custom 404 experience and Vercel SPA routing support

## Experience

The frontend is styled around the AuthCore visual direction:

- soft green security-focused palette
- glassy panels and clean dashboard cards
- verification-first account center
- device session management UI
- responsive auth and dashboard layouts

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Zustand
- Axios
- Tailwind CSS v4

### Backend

- Express 5
- MongoDB + Mongoose
- JWT
- Nodemailer
- CSRF protection
- Express rate limiting

## Project Structure

```text
AuthCore/
|-- backend/
|   |-- .env.example
|   |-- package-lock.json
|   |-- package.json
|   `-- src/
|       |-- app.js
|       |-- index.js
|       |-- config/
|       |   `-- db.js
|       |-- controllers/
|       |   `-- auth.controller.js
|       |-- docs/
|       |   `-- openapi.js
|       |-- middleware/
|       |   |-- auth.middleware.js
|       |   |-- error.middleware.js
|       |   `-- rateLimit.middleware.js
|       |-- models/
|       |   |-- log.model.js
|       |   |-- otp.model.js
|       |   `-- user.model.js
|       |-- routes/
|       |   `-- auth.routes.js
|       `-- utils/
|           |-- appError.js
|           |-- asyncHandler.js
|           |-- emailTemplate.js
|           |-- logger.utils.js
|           |-- sendEmail.js
|           `-- token.utils.js
|-- frontend/
|   |-- package-lock.json
|   |-- package.json
|   |-- vercel.json
|   |-- vite.config.js
|   `-- src/
|       |-- App.jsx
|       |-- index.css
|       |-- main.jsx
|       |-- components/
|       |   |-- auth/
|       |   |   |-- ProtectedRoute.jsx
|       |   |   `-- PublicOnlyRoute.jsx
|       |   |-- layout/
|       |   |   |-- AuthLayout.jsx
|       |   |   `-- DashboardLayout.jsx
|       |   `-- ui/
|       |       |-- AuthCard.jsx
|       |       |-- FieldGroup.jsx
|       |       `-- FormNotice.jsx
|       |-- lib/
|       |   `-- api.js
|       |-- pages/
|       |   |-- DashboardPage.jsx
|       |   |-- ForgotPasswordPage.jsx
|       |   |-- LoginPage.jsx
|       |   |-- NotFoundPage.jsx
|       |   |-- RegisterPage.jsx
|       |   |-- ResetPasswordPage.jsx
|       |   |-- SessionsPage.jsx
|       |   |-- VerifyLoginOtpPage.jsx
|       |   `-- VerifyRegistrationPage.jsx
|       |-- routes/
|       |   `-- AppRouter.jsx
|       `-- store/
|           `-- auth.store.js
|-- README.md
`-- .gitignore
```

## Core Flows

### Registration

1. User creates an account
2. Backend sends an email OTP
3. User lands on the verification page
4. OTP verification activates the account
5. User is signed in and redirected to the dashboard

### Login

- Login with password
- Or request a login OTP and verify it

### Recovery

1. Request password reset OTP
2. Verify OTP
3. Set a new password

### Sessions

- View active sessions
- Identify the current device
- Revoke older sessions
- Logout all devices when needed

## Local Setup

### 1. Clone the project

```bash
git clone <your-repo-url>
cd AuthCore
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/authcore
ACCESS_TOKEN_SECRET=change-me-access
REFRESH_TOKEN_SECRET=change-me-refresh
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=AuthCore <your-email@gmail.com>
CORS_ORIGINS=http://localhost:5173,http://localhost:5175
FRONTEND_URL=http://localhost:5175
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Run the frontend:

```bash
npm run dev
```

## API and Docs

When the backend is running:

- App backend: `http://localhost:5000`
- Auth base: `http://localhost:5000/api/v1/auth`
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`
- CSRF token route: `http://localhost:5000/api/csrf-token`

## Deployment Notes

### Frontend

The frontend includes a `vercel.json` rewrite so direct visits to routes like `/login`, `/register`, `/dashboard`, and `/sessions` work correctly on Vercel.

### Backend

Before deploying the backend, make sure you set:

- MongoDB connection string
- JWT secrets
- SMTP email credentials
- allowed frontend origins

## Suggested Test Flow

1. Start the backend
2. Start the frontend
3. Register a new user
4. Verify the email OTP
5. Confirm redirect to dashboard
6. Login from another browser
7. Open the Sessions page
8. Revoke a session
9. Test forgot-password flow

## Security Notes

- Use Gmail App Passwords or a dedicated SMTP provider for production
- Never commit real secrets to the repository
- Rotate any exposed credentials immediately
- Keep CORS origins restricted to trusted frontend domains
- Use secure cookies in production deployments

## AuthCore Theme

AuthCore is meant to feel calm, trustworthy, and operationally sharp. The product language combines secure workflows with a softer interface so account management feels confident instead of intimidating.

## License

This project is available for personal learning, portfolio use, and further extension.
