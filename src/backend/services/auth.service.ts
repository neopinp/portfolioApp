import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { authConfig } from "../config/auth";
import { AuthenticatedUser, UserCredentials, LoginCredentials } from "../types/auth";

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validatePassword(password: string): Promise<string | null> {
    if (password.length < authConfig.passwordMinLength) {
      return `Password must be at least ${authConfig.passwordMinLength} characters long`;
    }
    if (password.length > authConfig.passwordMaxLength) {
      return `Password cannot exceed ${authConfig.passwordMaxLength} characters`;
    }
    return null;
  }

  private mapToAuthenticatedUser(user: any): AuthenticatedUser {
    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username || ''
    };
  }

  async createUser(credentials: UserCredentials): Promise<AuthenticatedUser> {
    const hashed = await bcrypt.hash(credentials.password, authConfig.bcryptSaltRounds);
    
    const user = await this.prisma.users.create({
      data: {
        email: credentials.email,
        username: credentials.username,
        password: hashed,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    return this.mapToAuthenticatedUser(user);
  }

  async findUserByEmailOrUsername(emailOrUsername: string) {
    return this.prisma.users.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ],
      },
    });
  }

  async comparePasswords(inputPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  generateToken(user: AuthenticatedUser): string {
    if (!authConfig.jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }
    
    const signOptions: SignOptions = {
      expiresIn: authConfig.jwtExpiresIn
    };

    return jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      authConfig.jwtSecret,
      signOptions
    );
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthenticatedUser; token: string } | null> {
    const user = await this.findUserByEmailOrUsername(credentials.emailorUsername);
    
    if (!user) {
      return null;
    }

    const isValidPassword = await this.comparePasswords(credentials.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const authenticatedUser = this.mapToAuthenticatedUser(user);
    const token = this.generateToken(authenticatedUser);
    
    return {
      user: authenticatedUser,
      token
    };
  }
}
