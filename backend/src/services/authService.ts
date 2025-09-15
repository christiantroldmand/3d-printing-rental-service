import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private refreshTokenExpiresIn: string;
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    
    // Email transporter configuration
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: UserRole.CUSTOMER,
        },
      });

      // Generate JWT token
      const token = this.generateToken(user);

      // Send welcome email
      await this.sendWelcomeEmail(user.email, user.firstName);

      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(data: PasswordResetData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        this.jwtSecret,
        { expiresIn: '1h' }
      );

      // Store reset token in database (you might want to create a separate table for this)
      // For now, we'll use a simple approach with system config
      await prisma.systemConfig.upsert({
        where: { key: `password_reset_${user.id}` },
        update: { value: resetToken },
        create: {
          key: `password_reset_${user.id}`,
          value: resetToken,
          description: 'Password reset token',
        },
      });

      // Send reset email
      await this.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (error) {
      throw new Error(`Password reset initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirmData): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(data.token, this.jwtSecret) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid reset token');
      }

      // Check if token exists in database
      const storedToken = await prisma.systemConfig.findUnique({
        where: { key: `password_reset_${decoded.userId}` },
      });

      if (!storedToken || storedToken.value !== data.token) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      // Remove reset token
      await prisma.systemConfig.delete({
        where: { key: `password_reset_${decoded.userId}` },
      });
    } catch (error) {
      throw new Error(`Password reset confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: data.userId },
        data: { password: hashedPassword },
      });
    } catch (error) {
      throw new Error(`Password change failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<AuthUser> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: Partial<RegisterData>): Promise<AuthUser> {
    try {
      const updateData: any = {};
      
      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  /**
   * Sanitize user data (remove sensitive information)
   */
  private sanitizeUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@3dprintpro.com',
        to: email,
        subject: 'Welcome to 3D Print Pro!',
        html: `
          <h1>Welcome to 3D Print Pro, ${firstName}!</h1>
          <p>Thank you for registering with our 3D printing service. You can now start uploading your 3D files and placing orders.</p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The 3D Print Pro Team</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for email failures
    }
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@3dprintpro.com',
        to: email,
        subject: 'Password Reset - 3D Print Pro',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${firstName},</p>
          <p>You requested a password reset for your 3D Print Pro account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>The 3D Print Pro Team</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export default new AuthService();
