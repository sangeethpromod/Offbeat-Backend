import { Request, Response } from 'express';
import AuthUser from '../../Model/authModel';
import HostProfile from '../../Model/hostModel';

/**
 * GET /api/traveller/profile/:userId
 * Get traveller profile details
 */
export const getTravellerProfile = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const tokenRole = (req as any).jwtUser?.role;
    const tokenUserId = (req as any).jwtUser?.userId;

    // Check if user has Traveller or Host role
    if (tokenRole !== 'traveller' && tokenRole !== 'host') {
      console.log('Access denied - invalid role attempted to access profile:', {
        attemptedUserId: userId,
        actualRole: tokenRole,
      });
      res.status(403).json({
        success: false,
        message:
          'Only users with Traveller or Host role can access this endpoint',
      });
      return;
    }

    // Verify the userId from params matches the authenticated user
    if (tokenUserId !== userId) {
      console.log('Access denied - user attempted to access another profile:', {
        tokenUserId,
        requestedUserId: userId,
      });
      res.status(403).json({
        success: false,
        message: 'You can only access your own profile',
      });
      return;
    }

    console.log('Retrieving profile:', { userId, role: tokenRole });

    // Find the user
    const user = await AuthUser.findOne({ userId })
      .select('fullName email phoneNumber userId')
      .lean();

    if (!user) {
      console.log('User profile not found:', { userId });
      res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
      return;
    }

    // If token role is host, fetch host profile details
    if (tokenRole === 'host') {
      const hostProfile = await HostProfile.findOne({ userId })
        .select('age gender mobileNumber nationality location aadharNumber livePicUrl')
        .lean();

      if (!hostProfile) {
        console.log('Host profile not found, returning with empty fields:', { userId });
        res.status(200).json({
          success: true,
          message: 'Host profile retrieved successfully',
          data: {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber || null,
            age: '',
            gender: '',
            mobileNumber: '',
            nationality: '',
            location: '',
            aadharNumber: '',
            livePicUrl: '',
          },
        });
        return;
      }

      console.log('Host profile retrieved successfully:', { userId });

      res.status(200).json({
        success: true,
        message: 'Host profile retrieved successfully',
        data: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber || null,
          age: hostProfile.age || '',
          gender: hostProfile.gender || '',
          mobileNumber: hostProfile.mobileNumber || '',
          nationality: hostProfile.nationality || '',
          location: hostProfile.location || '',
          aadharNumber: hostProfile.aadharNumber || '',
          livePicUrl: hostProfile.livePicUrl || '',
        },
      });
      return;
    }

    // For traveller role, return basic profile
    console.log('Traveller profile retrieved successfully:', { userId });

    res.status(200).json({
      success: true,
      message: 'Traveller profile retrieved successfully',
      data: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
      },
    });
  } catch (error: any) {
    console.error('Error retrieving profile:', {
      userId: req.params.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};

/**
 * PUT /api/traveller/profile/:userId
 * Update traveller profile details
 */
export const updateTravellerProfile = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const tokenRole = (req as any).jwtUser?.role;
    const tokenUserId = (req as any).jwtUser?.userId;
    const { fullName, email, phoneNumber } = req.body;

    // Check if user has Traveller or Host role
    if (tokenRole !== 'traveller' && tokenRole !== 'host') {
      console.log('Access denied - invalid role attempted to update profile:', {
        attemptedUserId: userId,
        actualRole: tokenRole,
      });
      res.status(403).json({
        success: false,
        message:
          'Only users with Traveller or Host role can update this profile',
      });
      return;
    }

    // Verify the userId from params matches the authenticated user
    if (tokenUserId !== userId) {
      console.log('Access denied - user attempted to update another profile:', {
        tokenUserId,
        requestedUserId: userId,
      });
      res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
      return;
    }

    // Validate at least one field is provided
    if (!fullName && !email && !phoneNumber) {
      res.status(400).json({
        success: false,
        message:
          'At least one field (fullName, email, phoneNumber) is required for update',
      });
      return;
    }

    console.log('Updating traveller profile:', {
      userId,
      fields: {
        fullName: !!fullName,
        email: !!email,
        phoneNumber: !!phoneNumber,
      },
    });

    // Build update object with only provided fields
    const updateData: any = {};
    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Full name must be a non-empty string',
        });
        return;
      }
      updateData.fullName = fullName.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({
          success: false,
          message: 'Valid email address is required',
        });
        return;
      }
      updateData.email = email.toLowerCase().trim();

      // Check if email already exists for another user
      const existingUser = await AuthUser.findOne({
        email: updateData.email,
        userId: { $ne: userId },
      });

      if (existingUser) {
        console.log('Email already in use:', { email: updateData.email });
        res.status(400).json({
          success: false,
          message: 'Email address is already in use by another user',
        });
        return;
      }
    }

    if (phoneNumber !== undefined) {
      if (phoneNumber !== null && typeof phoneNumber !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Phone number must be a string or null',
        });
        return;
      }
      updateData.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    }

    // Update the user
    const updatedUser = await AuthUser.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    ).select('fullName email phoneNumber userId');

    if (!updatedUser) {
      console.log('Traveller profile not found for update:', { userId });
      res.status(404).json({
        success: false,
        message: 'Traveller profile not found',
      });
      return;
    }

    console.log('Traveller profile updated successfully:', {
      userId,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      message: 'Traveller profile updated successfully',
      data: {
        userId: updatedUser.userId,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber || null,
      },
    });
  } catch (error: any) {
    console.error('Error updating traveller profile:', {
      userId: req.params.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update traveller profile',
      error: error.message,
    });
  }
};

/**
 * PUT /api/traveller/profile/:userId/change-password
 * Change traveller password
 */
export const changeTravellerPassword = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const tokenRole = (req as any).jwtUser?.role;
    const tokenUserId = (req as any).jwtUser?.userId;
    const { currentPassword, newPassword } = req.body;

    // Check if user has Traveller or Host role
    if (tokenRole !== 'traveller' && tokenRole !== 'host') {
      console.log(
        'Access denied - invalid role attempted to change password:',
        {
          attemptedUserId: userId,
          actualRole: tokenRole,
        }
      );
      res.status(403).json({
        success: false,
        message: 'Only users with Traveller or Host role can change password',
      });
      return;
    }

    // Verify the userId from params matches the authenticated user
    if (tokenUserId !== userId) {
      console.log(
        'Access denied - user attempted to change another user password:',
        {
          tokenUserId,
          requestedUserId: userId,
        }
      );
      res.status(403).json({
        success: false,
        message: 'You can only change your own password',
      });
      return;
    }

    // Validate required fields
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Both currentPassword and newPassword are required',
      });
      return;
    }

    // Validate new password strength
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    console.log('Changing password for traveller:', { userId });

    // Find the user with password field
    const user = await AuthUser.findOne({ userId }).select('password userId');

    if (!user) {
      console.log('Traveller not found for password change:', { userId });
      res.status(404).json({
        success: false,
        message: 'Traveller profile not found',
      });
      return;
    }

    if (!user.password) {
      console.log('User has no password set:', { userId });
      res.status(400).json({
        success: false,
        message: 'User does not have a password set',
      });
      return;
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      console.log('Invalid current password provided:', { userId });
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await AuthUser.findOneAndUpdate(
      { userId },
      { password: hashedPassword },
      { new: true }
    );

    console.log('Password changed successfully:', { userId });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Error changing password:', {
      userId: req.params.userId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};
