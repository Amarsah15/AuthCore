export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "AuthCore API",
    version: "1.0.0",
    description:
      "Authentication API for registration, OTP verification, login, password reset, sessions, and token refresh.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development",
    },
  ],
  tags: [{ name: "System" }, { name: "Auth" }, { name: "Sessions" }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid credentials" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Aman Kumar" },
          email: {
            type: "string",
            format: "email",
            example: "aman@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "StrongPass123",
          },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      LoginOtpRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
          newPassword: {
            type: "string",
            format: "password",
            example: "NewStrongPass123",
          },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string", example: "67fe4ab3cd1234567890abcd" },
          ip: { type: "string", example: "::1" },
          userAgent: { type: "string", example: "Mozilla/5.0" },
          createdAt: { type: "string", format: "date-time" },
          isCurrent: { type: "boolean", example: true },
        },
      },
      LogoutSessionRequest: {
        type: "object",
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string", example: "67fe4ab3cd1234567890abcd" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", example: "user" },
          isVerified: { type: "boolean", example: true },
          loginAttempts: { type: "integer", example: 0 },
          lockUntil: { type: "string", nullable: true, format: "date-time" },
          tokenVersion: { type: "integer", example: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          accessToken: { type: "string" },
        },
      },
      MeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/User" },
        },
      },
      SessionsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          sessions: {
            type: "array",
            items: { $ref: "#/components/schemas/Session" },
          },
        },
      },
      CsrfTokenResponse: {
        type: "object",
        properties: {
          csrfToken: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["System"],
        summary: "Health-style welcome route",
        responses: {
          200: {
            description: "Welcome message",
            content: {
              "text/plain": {
                schema: { type: "string", example: "Welcome to AuthCore!" },
              },
            },
          },
        },
      },
    },
    "/api/csrf-token": {
      get: {
        tags: ["System"],
        summary: "Get CSRF token",
        responses: {
          200: {
            description: "CSRF token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CsrfTokenResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User created and OTP sent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify registration OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Account verified",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in and cookie set",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login-otp": {
      post: {
        tags: ["Auth"],
        summary: "Request OTP for login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/verify-login": {
      post: {
        tags: ["Auth"],
        summary: "Verify login OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in with OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request OTP for password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent for password reset",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset complete",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token using refresh cookie",
        responses: {
          200: {
            description: "New access token issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    accessToken: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current session",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Logout all devices",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "All sessions cleared",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout-session": {
      post: {
        tags: ["Sessions"],
        summary: "Logout one specific saved session",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutSessionRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Session removed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/sessions": {
      get: {
        tags: ["Sessions"],
        summary: "Get active sessions",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Session list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SessionsResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Current authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/admin": {
      get: {
        tags: ["Auth"],
        summary: "Admin-only example route",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Admin access granted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Admin access granted",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AuthCore API Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />
    <style>
      body { margin: 0; background: #f5f7f5; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api-docs.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`;
