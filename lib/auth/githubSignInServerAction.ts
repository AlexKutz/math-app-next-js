'use server'
import { signIn } from './authConfig'

export const handleGithubSignIn = async () => {
  try {
    await signIn('github', { redirectTo: '/' })
  } catch (error) {
    throw error
  }
}
