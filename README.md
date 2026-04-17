<div align="center">

<img src="frontend/public/favicon.svg" width="72" height="72" alt="AuthCore Logo" />

# AuthCore

**Security-first authentication with a polished React experience**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-authcore--rose.vercel.app-4ade80?style=for-the-badge&logo=vercel&logoColor=white)](https://authcore-rose.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongoosejs.com)

<br/>

</div>

---

## Features at a Glance

| Feature                    | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| **Email OTP Verification** | Register with email confirmation via one-time passcode |
| **Password & OTP Login**   | Flexible login methods for every user                  |
| **Two-Factor Auth (TOTP)** | 8-digit TOTP with QR code setup via authenticator apps |
| **Password Reset Flow**    | OTP-based recovery with secure token handling          |
| **Session Management**     | View, identify, and revoke active device sessions      |
| **Google OAuth**           | Sign in or sign up with Google                         |
| **CSRF Protection**        | CSRF-aware API requests with secure cookies            |
| **Audit Logging**          | Track auth events across accounts                      |
| **Rate Limiting**          | Built-in abuse prevention on auth routes               |
| **OpenAPI / Swagger Docs** | Interactive API documentation out of the box           |

---

## 🚀 Live Demo

**[https://authcore-rose.vercel.app](https://authcore-rose.vercel.app)**

> Try the full flow: register → verify email OTP → login → manage sessions → enable 2FA

---

## Core Auth Flows

<details>
<summary><strong>Registration</strong></summary>

1. User submits their details to create an account
2. Backend sends a time-limited email OTP
3. User is redirected to the verification page
4. OTP verification activates the account
5. User is signed in and lands on the dashboard

</details>

<details>
<summary><strong>Login</strong></summary>

- Standard password login
- OTP-based passwordless login
- Google OAuth (sign in or sign up)
- 2FA challenge when TOTP is enabled

</details>

<details>
<summary><strong>Two-Factor Authentication</strong></summary>

1. Initiate 2FA setup from the dashboard
2. Scan the QR code in any authenticator app (Google Authenticator, Authy, etc.)
3. Confirm with the 8-digit TOTP code to activate
4. Future logins will prompt for the TOTP challenge

</details>

<details>
<summary><strong>Password Recovery</strong></summary>

1. Request a password reset from the forgot-password page
2. Enter the OTP sent to your email
3. Set a new password securely

</details>

<details>
<summary><strong>Session Management</strong></summary>

- View all active sessions with device info
- Identify your current session
- Revoke individual sessions
- Log out of all devices at once

</details>

---

## Tech Stack

### Frontend

| Tool                                       | Purpose                       |
| ------------------------------------------ | ----------------------------- |
| [React 19](https://react.dev)              | UI framework                  |
| [Vite](https://vitejs.dev)                 | Build tool                    |
| [React Router](https://reactrouter.com)    | Client-side routing           |
| [Zustand](https://zustand-demo.pmnd.rs)    | Auth state management         |
| [Axios](https://axios-http.com)            | HTTP client with CSRF support |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling         |

### Backend

| Tool                                                                                         | Purpose                   |
| -------------------------------------------------------------------------------------------- | ------------------------- |
| [Express 5](https://expressjs.com)                                                           | Web framework             |
| [MongoDB + Mongoose](https://mongoosejs.com)                                                 | Database & ODM            |
| [JWT](https://jwt.io)                                                                        | Stateless auth tokens     |
| [Nodemailer](https://nodemailer.com)                                                         | Transactional email (OTP) |
| [Otplib](https://github.com/yeojz/otplib) + [QRCode](https://github.com/soldair/node-qrcode) | TOTP 2FA                  |
| [csurf](https://github.com/expressjs/csurf)                                                  | CSRF protection           |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)               | Rate limiting             |

---

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
|       |   |-- VerifyRegistrationPage.jsx
|       |   `-- VerifyTwoFactorPage.jsx
|       |-- routes/
|       |   `-- AppRouter.jsx
|       `-- store/
|           `-- auth.store.js
|-- README.md
`-- .gitignore
```

---

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
- Or continue with Google / X OAuth

### Two-Factor Authentication

- Start 2FA setup from dashboard
- Scan QR in an authenticator app
- Verify with 8-digit code to enable
- Use 2FA challenge during login when enabled

### Recovery

1. Request password reset OTP
2. Verify OTP
3. Set a new password

### Sessions

- View active sessions
- Identify the current device
- Revoke older sessions
- Logout all devices when needed

---

## Local Setup

### 1 — Clone the repo

```bash
git clone https://github.com/Amarsah15/AuthCore.git
cd AuthCore
```

### 2 — Backend

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

CORS_ORIGINS=http://localhost:5173,https://authcore-rose.vercel.app
FRONTEND_URL=http://localhost:5173

OAUTH_STATE_SECRET=change-me-oauth-state
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/v1/auth/oauth/google/callback
```

```bash
npm run dev
```

### 3 — Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
```

---

## API & Docs

Once the backend is running:

| Endpoint                               | Description   |
| -------------------------------------- | ------------- |
| `http://localhost:5000`                | Backend root  |
| `http://localhost:5000/api/v1/auth`    | Auth base URL |
| `http://localhost:5000/api-docs`       | Swagger UI    |
| `http://localhost:5000/api-docs.json`  | OpenAPI JSON  |
| `http://localhost:5000/api/csrf-token` | CSRF token    |

---

## Suggested Test Flow

```
1. Start the backend            npm run dev  (inside /backend)
2. Start the frontend           npm run dev  (inside /frontend)
3. Register a new account
4. Verify the email OTP
5. Confirm dashboard redirect
6. Login from another browser
7. Open the Sessions page
8. Revoke a session
9. Test the forgot-password flow
10. Enable 2FA from the dashboard
```

---

## Security Notes

- Use **Gmail App Passwords** or a dedicated SMTP provider (Resend, Postmark) in production
- **Never commit real secrets** to the repository — use environment variables only
- Rotate any accidentally exposed credentials immediately
- Keep **CORS origins** restricted to trusted frontend domains
- Enable **secure cookies** and HTTPS in production deployments

---

## Design Direction

AuthCore is styled around a soft green, security-focused palette. The UI uses:

- Glassy panels and clean dashboard cards
- Verification-first account center
- Responsive auth and dashboard layouts
- Calm, trustworthy tone — confident instead of intimidating

---

## License

Available for further extension.

---

<div align="center">
  <sub>Built with care by <a href="https://github.com/Amarsah15">Amarsah15</a></sub>
</div>
