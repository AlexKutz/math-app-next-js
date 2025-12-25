'use server'

import { signOut } from '@/lib/auth/authConfig'

export const handleGoogleSignOut = async () => {
  try {
    await signOut()
  } catch (error) {
    throw error
  }
}
