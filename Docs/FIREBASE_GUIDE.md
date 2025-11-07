# Firebase Integration Guide

This document provides examples and instructions for integrating with the Firebase-enabled backend.

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication > Sign-in methods > Email/Password and Google

### 2. Generate Service Account Key

1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Download the JSON file
4. Rename it to `serviceAccountKey.json` and place in project root
5. **NEVER commit this file to version control!**

### 3. Get Firebase Config for Frontend

1. Go to Project Settings > General
2. Add a web app if you haven't already
3. Copy the Firebase config object

## 🌐 Frontend Integration Examples

### React/JavaScript Example

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-app-id',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

```javascript
// auth-service.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';

const API_BASE = 'http://localhost:8080/api';

// Register with email/password
export const registerTraveller = async userData => {
  try {
    // Register with backend (this creates Firebase user)
    const response = await fetch(`${API_BASE}/auth/register-traveller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (result.success) {
      // Sign in to Firebase with the custom token
      const customToken = result.data.firebaseToken;
      await signInWithCustomToken(auth, customToken);

      // Store tokens
      localStorage.setItem('appToken', result.data.token);
      localStorage.setItem('firebaseToken', customToken);

      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login with email/password
export const login = async (email, password) => {
  try {
    // Login through backend
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.success) {
      // Sign in to Firebase with custom token
      const customToken = result.data.firebaseToken;
      await signInWithCustomToken(auth, customToken);

      // Store tokens
      localStorage.setItem('appToken', result.data.token);
      localStorage.setItem('firebaseToken', customToken);

      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    // Sign in with Google via Firebase
    const firebaseResult = await signInWithPopup(auth, googleProvider);
    const idToken = await firebaseResult.user.getIdToken();

    // Send Firebase ID token to backend
    const response = await fetch(`${API_BASE}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const result = await response.json();

    if (result.success) {
      // Store tokens
      localStorage.setItem('appToken', result.data.token);
      localStorage.setItem('firebaseToken', idToken);

      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('appToken');
    localStorage.removeItem('firebaseToken');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Get current Firebase ID token (for API calls)
export const getCurrentToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};
```

### React Component Example

```jsx
// components/AuthComponent.jsx
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import {
  registerTraveller,
  login,
  signInWithGoogle,
  logout,
  getCurrentToken,
} from '../auth-service';

const AuthComponent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'traveller',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async e => {
    e.preventDefault();
    try {
      const result = await registerTraveller(formData);
      console.log('Registration successful:', result);
    } catch (error) {
      console.error('Registration failed:', error.message);
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const result = await login(formData.email, formData.password);
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      console.log('Google sign-in successful:', result);
    } catch (error) {
      console.error('Google sign-in failed:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  // Example of making authenticated API calls
  const makeAuthenticatedRequest = async () => {
    try {
      const token = await getCurrentToken();
      const response = await fetch('/api/protected-endpoint', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Protected data:', data);
    } catch (error) {
      console.error('API request failed:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome, {user.displayName || user.email}!</h2>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={makeAuthenticatedRequest}>
            Make Authenticated Request
          </button>
        </div>
      ) : (
        <div>
          <h2>Authentication</h2>

          {/* Registration Form */}
          <form onSubmit={handleRegister}>
            <h3>Register</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={e =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button type="submit">Register</button>
          </form>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <h3>Login</h3>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button type="submit">Login</button>
          </form>

          {/* Google Sign-In */}
          <div>
            <h3>Or</h3>
            <button onClick={handleGoogleSignIn}>Sign in with Google</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
```

## 🛡️ Security Best Practices

### 1. Token Management

- Always use Firebase ID tokens for backend authentication
- Refresh tokens automatically (Firebase SDK handles this)
- Store tokens securely (consider using secure storage solutions)

### 2. Environment Variables

```bash
# Frontend .env file
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_API_URL=http://localhost:8080/api
```

### 3. Error Handling

```javascript
// Comprehensive error handling
const handleAuthError = error => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'Email address is already registered.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return error.message || 'An authentication error occurred.';
  }
};
```

## 🔄 Integration Flow

### Registration Flow

1. User fills registration form
2. Frontend calls `/api/auth/register-traveller`
3. Backend creates Firebase user
4. Backend saves user to database with Firebase UID
5. Backend returns custom Firebase token + app JWT token
6. Frontend signs in to Firebase with custom token
7. User is now authenticated in both Firebase and your app

### Google Sign-In Flow

1. User clicks "Sign in with Google"
2. Firebase handles Google OAuth flow
3. Frontend receives Firebase ID token
4. Frontend sends ID token to `/api/auth/google-login`
5. Backend verifies token with Firebase Admin SDK
6. Backend creates/updates user in database
7. Backend returns app JWT token
8. User is authenticated

### Protected Route Access

1. Frontend gets current Firebase ID token
2. Include token in `Authorization: Bearer <token>` header
3. Backend verifies token using `verifyFirebaseToken` middleware
4. If valid, `req.user` contains Firebase user data
5. Proceed with authorized request

## 🚀 Deployment Notes

### Environment Variables for Production

```bash
# Backend production environment
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/offbeat
JWT_SECRET=your-super-secret-jwt-key-for-production
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-production-s3-bucket
PORT=8080

# Firebase service account should be properly secured
# Consider using secrets management in production
```

### Security Considerations

1. **Never expose service account keys** in client-side code
2. **Use HTTPS** in production for all API calls
3. **Implement rate limiting** for authentication endpoints
4. **Set up Firebase Security Rules** for additional protection
5. **Monitor authentication logs** for suspicious activity
6. **Use environment-specific Firebase projects** (dev/staging/prod)

## 🧪 Testing

```javascript
// Example test for authentication service
describe('Authentication Service', () => {
  test('should register user successfully', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'traveller',
    };

    const result = await registerTraveller(userData);

    expect(result.user.email).toBe(userData.email);
    expect(result.token).toBeDefined();
    expect(result.firebaseToken).toBeDefined();
  });

  test('should handle Google sign-in', async () => {
    // Mock Firebase Auth
    const mockIdToken = 'mock-firebase-id-token';

    const result = await signInWithGoogle();

    expect(result.user.firebaseUid).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

# Firebase Authentication Integration - Summary

## 🎯 Overview

Successfully integrated Firebase Authentication with the existing authentication system, maintaining backward compatibility while adding Google Sign-In and Firebase token verification.

## 🚀 What Was Implemented

### 1. **Firebase Admin SDK Setup**

- ✅ Installed `firebase-admin` package
- ✅ Created `src/Config/firebase.ts` for Firebase initialization
- ✅ Added secure service account key loading from `serviceAccountKey.json`
- ✅ Added service account key to `.gitignore` for security

### 2. **Enhanced Authentication Controller**

- ✅ Updated `registerTraveller()` to create Firebase users alongside database records
- ✅ Enhanced `login()` to generate Firebase custom tokens
- ✅ Added new `googleLogin()` endpoint for Google Sign-In authentication
- ✅ Maintained existing API structure and behavior

### 3. **Firebase Middleware**

- ✅ Created `src/Middleware/firebaseAuth.ts` with `verifyFirebaseToken` middleware
- ✅ Proper token verification using Firebase Admin SDK
- ✅ Comprehensive error handling for expired/revoked tokens
- ✅ Attaches Firebase user info to `req.user`

### 4. **Database Schema Updates**

- ✅ Added `firebaseUid` field to `AuthUser` model
- ✅ Added sparse unique index for Firebase UID
- ✅ Updated TypeScript interfaces for Firebase integration

### 5. **New API Endpoints**

- ✅ `POST /api/auth/register-traveller` - Now creates Firebase user + database record
- ✅ `POST /api/auth/login` - Returns both JWT and Firebase tokens
- ✅ `POST /api/auth/google-login` - New Google Sign-In endpoint
- ✅ Middleware: `verifyFirebaseToken` for protecting routes

### 6. **Enhanced Type Definitions**

- ✅ Added `GoogleLoginRequest` and `GoogleLoginResponse` types
- ✅ Extended Express Request type with Firebase user data
- ✅ Updated existing response types to include Firebase tokens

### 7. **Updated Documentation**

- ✅ Enhanced Swagger/OpenAPI documentation with new endpoints
- ✅ Updated README with Firebase setup instructions
- ✅ Created comprehensive `FIREBASE_GUIDE.md` with frontend examples
- ✅ Added authentication flow diagrams

## 🔧 Technical Details

### API Responses Now Include:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {
      "userId": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "traveller",
      "firebaseUid": "firebase-uid-123"
    },
    "token": "jwt-token-for-app",
    "firebaseToken": "firebase-custom-token-or-id-token"
  }
}
```

### Authentication Flow:

1. **Email/Password Registration**: Creates Firebase user → Saves to DB → Returns both tokens
2. **Email/Password Login**: Verifies credentials → Generates Firebase token → Returns both tokens
3. **Google Sign-In**: Verifies Firebase ID token → Creates/updates user → Returns app token
4. **Protected Routes**: Use `verifyFirebaseToken` middleware with `Authorization: Bearer <firebase-token>`

### Backward Compatibility:

- ✅ Existing JWT authentication still works
- ✅ All existing endpoints maintain same request/response structure
- ✅ Database models are backward compatible
- ✅ No breaking changes to existing functionality

## 🛡️ Security Features

### Firebase Integration:

- ✅ Secure service account key management
- ✅ Firebase Admin SDK for server-side token verification
- ✅ Custom token generation for seamless auth flow
- ✅ Proper error handling for Firebase Auth errors

### Enhanced Security:

- ✅ Dual token system (Firebase + JWT) for flexibility
- ✅ Token-based authentication for all endpoints
- ✅ Role-based access control maintained
- ✅ Secure file handling with Firebase user context

## 📁 New Files Created

```
src/
├── Config/
│   └── firebase.ts              # Firebase Admin SDK initialization
├── Middleware/
│   └── firebaseAuth.ts          # Firebase token verification middleware
FIREBASE_GUIDE.md                # Comprehensive frontend integration guide
serviceAccountKey.json.example   # Template for Firebase service account
```

## 📝 Modified Files

```
src/
├── Controller/Auth/
│   └── authController.ts        # Enhanced with Firebase integration
├── Model/
│   └── authModel.ts            # Added firebaseUid field
├── Routes/
│   └── authRoute.ts            # Added Google login route
├── Types/
│   └── index.ts                # Added Firebase types and interfaces
├── swagger/
│   └── authSwagger.ts          # Updated API documentation
package.json                     # Added firebase-admin dependency
README.md                        # Updated with Firebase setup
.gitignore                      # Added Firebase service account exclusion
```

## 🚀 Getting Started

### For Backend Developers:

1. Install dependencies: `npm install`
2. Set up Firebase service account key as `serviceAccountKey.json`
3. Update environment variables if needed
4. Run: `npm run dev`
5. Test endpoints at `http://localhost:8080/api-docs`

### For Frontend Developers:

1. Read `FIREBASE_GUIDE.md` for complete integration examples
2. Set up Firebase project and get config
3. Use provided React/JavaScript examples
4. Implement authentication flows as needed

## ✅ Testing Status

- ✅ TypeScript compilation successful
- ✅ Server starts without errors
- ✅ Firebase Admin SDK initializes correctly
- ✅ MongoDB connection established
- ✅ Swagger documentation updated and accessible
- ✅ All existing functionality preserved

## 🎉 Benefits Achieved

1. **Google Sign-In Support**: Users can authenticate via Google OAuth
2. **Firebase Ecosystem**: Access to Firebase services (Realtime DB, Cloud Functions, etc.)
3. **Enhanced Security**: Firebase token verification with Admin SDK
4. **Scalable Authentication**: Firebase handles user management and token lifecycle
5. **Developer Experience**: Comprehensive documentation and examples
6. **Backward Compatibility**: Existing systems continue to work unchanged
7. **Frontend Flexibility**: Multiple authentication options for different user flows

## 🔄 Next Steps (Optional)

1. **Firebase Security Rules**: Set up Firestore/Realtime Database rules
2. **Push Notifications**: Integrate Firebase Cloud Messaging
3. **Analytics**: Add Firebase Analytics for user behavior tracking
4. **Performance Monitoring**: Set up Firebase Performance Monitoring
5. **Social Logins**: Add Facebook, Twitter, etc. via Firebase Auth
6. **Email Verification**: Implement Firebase email verification flows
7. **Password Reset**: Add Firebase password reset functionality

---

**✨ The authentication system is now Firebase-ready while maintaining full backward compatibility with existing implementations.**
