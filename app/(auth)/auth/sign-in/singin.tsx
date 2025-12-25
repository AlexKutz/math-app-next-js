'use client'
import { LoginForm } from '@/components/auth/LoginForm'

export const SignInPage = () => {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="px-14 py-6 bg-white shadow-md rounded-md">
        <LoginForm onSuccess={() => {}} />
      </div>
    </div>
  )
}
