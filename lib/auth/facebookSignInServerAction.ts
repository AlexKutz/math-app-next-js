'use server'
import { signIn } from './authConfig'

export const handleFacebookSignIn = async () => {
  try {
    await signIn('facebook', { redirectTo: '/' })
  } catch (error) {
    throw error
  }
}
