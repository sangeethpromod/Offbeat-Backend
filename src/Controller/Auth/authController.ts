import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AuthUser from '../../Model/authModel';
import Role from '../../Model/roleModel';
import {
  RegisterTravellerRequest,
  LoginRequest,
  ApiResponse,
  LoginResponse,
} from '../../Types';

/**
 * Register a new traveller
 */
export const registerTraveller = async (
  req: Request<{}, ApiResponse, RegisterTravellerRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: fullName, email, password, role',
      });
      return;
    }

    // Check if role exists and is ACTIVE
    const roleDoc = await Role.findOne({
      roleName: role,
      roleStatus: 'ACTIVE',
    });
    if (!roleDoc) {
      res.status(400).json({
        success: false,
        message: 'Invalid role or role is not active',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await AuthUser.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new AuthUser({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser.userId,
        email: savedUser.email,
        role: savedUser.role,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Traveller registered successfully',
      data: {
        user: {
          userId: savedUser.userId,
          fullName: savedUser.fullName,
          email: savedUser.email,
          role: savedUser.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error registering traveller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Login user (both travellers and completed hosts)
 */
export const login = async (
  req: Request<{}, ApiResponse<LoginResponse>, LoginRequest>,
  res: Response<ApiResponse<LoginResponse>>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await AuthUser.findOne({ email, isActive: true });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user has a password (hosts might not have password until step 2)
    if (!user.password) {
      res.status(401).json({
        success: false,
        message:
          'Account setup is incomplete. Please complete your registration.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
