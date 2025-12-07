import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AuthUser from '../../Model/authModel';
import HostProfile from '../../Model/hostModel';
import Role from '../../Model/roleModel';
import s3Service from '../../Service/s3Service';
import { generateOTP, sendOTPEmail, validateOTP } from '../../Utils/otpHelper';
import {
  RegisterHostStep1Request,
  RegisterHostStep2Request,
  RegisterHostStep3Request,
  ApiResponse,
  HostStepResponse,
} from '../../Types';

/**
 * Host Registration Step 1: Create AuthUser and HostProfile with basic info and send OTP
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

    // Generate OTP
    const otp = generateOTP();
    const otpTimestamp = Date.now();

    // Create HostProfile with OTP
    const newHostProfile = new HostProfile({
      userId: savedUser.userId,
      age,
      gender,
      mobileNumber,
      nationality,
      otp,
      otpTimestamp,
      isEmailVerified: false,
      onboardingStep: 1,
      isOnboardingComplete: false,
    });

    const savedHostProfile = await newHostProfile.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, fullName, otp);

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message:
        'Host registration step 1 completed successfully. OTP sent to email.',
      data: {
        hostId: savedHostProfile.hostId,
        userId: savedUser.userId,
        onboardingStep: 1,
        isOnboardingComplete: false,
        message:
          'Please verify your email with the OTP sent to your email address',
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
 * Host Registration Step 2: Verify OTP and set password
 */
export const registerHostStep2 = async (
  req: Request<
    { userId: string },
    ApiResponse<HostStepResponse>,
    RegisterHostStep2Request & { otp: string }
  >,
  res: Response<ApiResponse<HostStepResponse>>
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { password, otp } = req.body;

    // Validate required fields
    if (!password || !otp) {
      res.status(400).json({
        success: false,
        message: 'Password and OTP are required',
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

    // Validate OTP
    const isOTPValid = validateOTP(
      hostProfile.otp!,
      hostProfile.otpTimestamp!,
      otp
    );

    if (!isOTPValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new OTP.',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user with password and mark email as verified
    await AuthUser.findOneAndUpdate(
      { userId },
      { password: hashedPassword },
      { new: true }
    );

    // Update host profile step and mark email as verified
    const updatedHostProfile = await HostProfile.findOneAndUpdate(
      { userId },
      {
        onboardingStep: 2,
        isEmailVerified: true,
        otp: null,
        otpTimestamp: null,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message:
        'Host registration step 2 completed successfully. Email verified.',
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
    console.log(req.files, req.body);

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
          status: 'PENDING', // Set status to PENDING after completing step 3
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

/**
 * Update host details (excluding images)
 * PATCH /api/host/update-profile
 */
export const updateHostProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).jwtUser?.userId;
    const {
      fullName,
      age,
      gender,
      mobileNumber,
      nationality,
      location,
      aadharNumber,
    } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
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

    // Build update object for AuthUser
    const userUpdates: any = {};
    if (fullName) userUpdates.fullName = fullName;

    // Build update object for HostProfile
    const profileUpdates: any = {};
    if (age !== undefined) profileUpdates.age = age;
    if (gender) profileUpdates.gender = gender;
    if (mobileNumber) profileUpdates.mobileNumber = mobileNumber;
    if (nationality) profileUpdates.nationality = nationality;
    if (location) profileUpdates.location = location;
    if (aadharNumber) profileUpdates.aadharNumber = aadharNumber;

    // Update AuthUser if there are changes
    if (Object.keys(userUpdates).length > 0) {
      await AuthUser.findOneAndUpdate({ userId }, userUpdates, { new: true });
    }

    // Update HostProfile if there are changes
    let updatedProfile = hostProfile;
    if (Object.keys(profileUpdates).length > 0) {
      updatedProfile = (await HostProfile.findOneAndUpdate(
        { userId },
        profileUpdates,
        { new: true }
      ))!;
    }

    // Get updated user data
    const updatedUser = await AuthUser.findOne({ userId });

    res.status(200).json({
      success: true,
      message: 'Host profile updated successfully',
      data: {
        userId: updatedUser!.userId,
        fullName: updatedUser!.fullName,
        email: updatedUser!.email,
        age: updatedProfile.age,
        gender: updatedProfile.gender,
        mobileNumber: updatedProfile.mobileNumber,
        nationality: updatedProfile.nationality,
        location: updatedProfile.location,
        aadharNumber: updatedProfile.aadharNumber,
      },
    });
  } catch (error) {
    console.error('Error updating host profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Reset password
 * PATCH /api/host/reset-password
 */
export const resetHostPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).jwtUser?.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Validate required fields
    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Old password and new password are required',
      });
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
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

    // Check if user has a password
    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'No password set for this account',
      });
      return;
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Old password is incorrect',
      });
      return;
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: 'New password cannot be the same as old password',
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await AuthUser.findOneAndUpdate(
      { userId },
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
