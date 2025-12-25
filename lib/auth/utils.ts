'use server'
import { auth } from '@/lib/auth/authConfig'

export const getSession = async () => {
  const session = await auth()
  if (session?.user) {
    return session
  } else {
    return null
  }
}
