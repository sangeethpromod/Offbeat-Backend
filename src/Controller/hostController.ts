import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AuthUser from '../Model/authModel';
import HostProfile from '../Model/hostModel';
import Role from '../Model/roleModel';
import s3Service from '../Service/s3Service';
import {
  RegisterHostStep1Request,
  RegisterHostStep2Request,
  RegisterHostStep3Request,
  ApiResponse,
  HostStepResponse,
} from '../Types';

/**
 * Host Registration Step 1: Create AuthUser and HostProfile with basic info
 */
export const registerHostStep1 = async (
  req: Request<{}, ApiResponse<HostStepResponse>, RegisterHostStep1Request>,
  res: Response<ApiResponse<HostStepResponse>>
): Promise<void> => {
  try {
    const { fullName, email, age, gender, mobileNumber, nationality, role } =
      req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !age ||
      !gender ||
      !mobileNumber ||
      !nationality ||
      !role
    ) {
      res.status(400).json({
        success: false,
        message:
          'All fields are required: fullName, email, age, gender, mobileNumber, nationality, role',
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

    // Create AuthUser without password
    const newUser = new AuthUser({
      fullName,
      email,
      role,
      // password will be set in step 2
    });

    const savedUser = await newUser.save();

    // Create HostProfile
    const newHostProfile = new HostProfile({
      userId: savedUser.userId,
      age,
      gender,
      mobileNumber,
      nationality,
      onboardingStep: 1,
      isOnboardingComplete: false,
    });

    const savedHostProfile = await newHostProfile.save();

    res.status(201).json({
      success: true,
      message: 'Host registration step 1 completed successfully',
      data: {
        hostId: savedHostProfile.hostId,
        userId: savedUser.userId,
        onboardingStep: 1,
        isOnboardingComplete: false,
        message: 'Please proceed to step 2 to set your password',
      },
    });
  } catch (error) {
    console.error('Error in host registration step 1:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Host Registration Step 2: Set password
 */
export const registerHostStep2 = async (
  req: Request<
    { userId: string },
    ApiResponse<HostStepResponse>,
    RegisterHostStep2Request
  >,
  res: Response<ApiResponse<HostStepResponse>>
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Validate required fields
    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required',
      });
      return;
    }

    // Find the user
    const user = await AuthUser.findOne({ userId });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ userId });
    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host profile not found',
      });
      return;
    }

    // Check if user is on correct step
    if (hostProfile.onboardingStep !== 1) {
      res.status(400).json({
        success: false,
        message: `Invalid step. Expected step 2, but user is on step ${hostProfile.onboardingStep + 1}`,
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user with password
    await AuthUser.findOneAndUpdate(
      { userId },
      { password: hashedPassword },
      { new: true }
    );

    // Update host profile step
    const updatedHostProfile = await HostProfile.findOneAndUpdate(
      { userId },
      { onboardingStep: 2 },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Host registration step 2 completed successfully',
      data: {
        hostId: updatedHostProfile!.hostId,
        userId: user.userId,
        onboardingStep: 2,
        isOnboardingComplete: false,
        message: 'Please proceed to step 3 to upload documents',
      },
    });
  } catch (error) {
    console.error('Error in host registration step 2:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Host Registration Step 3: Upload documents and complete registration
 */
export const registerHostStep3 = async (
  req: Request<
    { userId: string },
    ApiResponse<HostStepResponse>,
    RegisterHostStep3Request
  >,
  res: Response<ApiResponse<HostStepResponse>>
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { location, aadharNumber } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate required fields
    if (!location || !aadharNumber) {
      res.status(400).json({
        success: false,
        message: 'Location and aadharNumber are required',
      });
      return;
    }

    // Validate files
    if (
      !files ||
      !files.aadharFile ||
      !files.pccCertificateFile ||
      !files.livePicFile
    ) {
      res.status(400).json({
        success: false,
        message:
          'All files are required: aadharFile, pccCertificateFile, livePicFile',
      });
      return;
    }

    // Find the user
    const user = await AuthUser.findOne({ userId });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ userId });
    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host profile not found',
      });
      return;
    }

    // Check if user is on correct step
    if (hostProfile.onboardingStep !== 2) {
      res.status(400).json({
        success: false,
        message: `Invalid step. Expected step 3, but user is on step ${hostProfile.onboardingStep + 1}`,
      });
      return;
    }

    try {
      // Upload files to S3
      const aadharUrls = await s3Service.uploadAadharDocuments(
        files.aadharFile
      );
      const pccCertificateUrl = await s3Service.uploadPCCCertificate(
        files.pccCertificateFile[0]!
      );
      const livePicUrl = await s3Service.uploadLivePicture(
        files.livePicFile[0]!
      );

      // Update host profile with all remaining fields
      const updatedHostProfile = await HostProfile.findOneAndUpdate(
        { userId },
        {
          location,
          aadharNumber,
          aadharDocs: aadharUrls,
          pccCertificateUrl,
          livePicUrl,
          onboardingStep: 3,
          isOnboardingComplete: true,
        },
        { new: true }
      );

      // Generate JWT token for immediate login
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
        message: 'Host registration completed successfully',
        data: {
          hostId: updatedHostProfile!.hostId,
          userId: user.userId,
          onboardingStep: 3,
          isOnboardingComplete: true,
          message: 'Registration complete! You can now login.',
          token,
          user: {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (uploadError) {
      console.error('Error uploading files:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files. Please try again.',
      });
      return;
    }
  } catch (error) {
    console.error('Error in host registration step 3:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get host onboarding status
 */
export const getHostStatus = async (
  req: Request<{ userId: string }>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await AuthUser.findOne({ userId });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ userId });
    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Host status retrieved successfully',
      data: {
        userId: user.userId,
        hostId: hostProfile.hostId,
        fullName: user.fullName,
        email: user.email,
        onboardingStep: hostProfile.onboardingStep,
        isOnboardingComplete: hostProfile.isOnboardingComplete,
        hasPassword: !!user.password,
      },
    });
  } catch (error) {
    console.error('Error getting host status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
