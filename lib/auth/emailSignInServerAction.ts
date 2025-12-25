'use server'

import { signIn } from '@/lib/auth/authConfig'

export const handleEmailSignIn = async (email: string) => {
  try {
    await signIn('resend', { email, callBackUrl: '/' })
  } catch (error) {
    throw error
  }
}
