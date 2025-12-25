import { redirect } from 'next/navigation'
import { SignInPage } from './singin'

export default function SignIn() {
  const isAuthenticated = false
  // const isAuthenticated = isAuthenticated() // Replace with actual auth check

  if (isAuthenticated) {
    redirect('/dashboard')
  } else {
    return <SignInPage />
  }
}
