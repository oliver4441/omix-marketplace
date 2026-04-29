import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (user: { id: number; email: string; userTypeId: number }) => {
  return jwt.sign(
    { id: user.id, email: user.email, userTypeId: user.userTypeId },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: number; email: string; userTypeId: number }
}

export const getTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export const verifyRequest = (request: NextRequest) => {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { error: 'No token provided', status: 401 }
  }
  try {
    const decoded = verifyToken(token)
    return { user: decoded }
  } catch {
    return { error: 'Invalid or expired token', status: 401 }
  }
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  userTypeId: z.number().default(4),
})
