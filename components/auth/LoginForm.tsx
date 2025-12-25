'use client'

import { handleEmailSignIn } from '@/lib/auth/emailSignInServerAction'
import { handleFacebookSignIn } from '@/lib/auth/facebookSignInServerAction'
import { isValidEmail } from '@/lib/validation/email'
import { ChangeEvent, useState } from 'react'
import { FaGithub, FaFacebook } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { signIn, useSession } from 'next-auth/react'

export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<null | string>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const { update } = useSession()

  const signInWithPopup = (providerId: 'google' | 'github' | 'facebook') => {
    const width = 500
    const height = 700
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2

    const popup = window.open(
      `/auth/signin-popup?provider=${providerId}`,
      'OAuth SignIn',
      `width=${width},height=${height},top=${top},left=${left}`
    )

    // FALLBACK:
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.warn('Popup blocked! Redirecting instead...')
      signIn(providerId, { callbackUrl: '/' })
      return
    }

    const handler = async (event: MessageEvent) => {
      if (event.data === 'signin-success') {
        onSuccess()

        await update()

        popup?.close()

        window.removeEventListener('message', handler)
      }
    }

    window.addEventListener('message', handler)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isValidEmail(e.target.value)) {
      setEmail(e.target.value)
      setEmailError(null)
    } else {
      setEmailError('Invalid email address')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    handleEmailSignIn(email)
  }

  const handleSignIn = (fn: () => Promise<void>) => {
    return async () => {
      try {
        await fn()
        onSuccess()
      } catch (error) {
        console.error('Sign-in error:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-3 text-center text-gray-600">Увійти</h1>
      <div className="my-8 mb-16">
        <div className="h-0.5 absolute left-0 w-full flex justify-center items-center text-center bg-gray-300">
          <div className="w-36 text-center bg-white text-gray-400 font-bold">
            За допомогою
          </div>
        </div>
      </div>
      <div className="social-logins flex flex-col gap-3">
        <button
          onClick={signInWithPopup.bind(null, 'google')}
          className="flex items-center h-12 justify-center w-full gap-2 px-1 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        >
          <div className="aspect-square rounded flex items-center justify-center h-8">
            <FcGoogle className="w-full h-full p-1" />
          </div>
          <div className="pr-2">Google</div>
        </button>
        <button
          onClick={signInWithPopup.bind(null, 'github')}
          className="flex items-center h-12 justify-center w-full gap-2 px-1 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        >
          <div className="aspect-square rounded flex items-center justify-center h-8">
            <FaGithub className="w-full h-full p-1" />
          </div>
          <div className="pr-2">Github</div>
        </button>
        <button
          onClick={signInWithPopup.bind(null, 'facebook')}
          className="flex items-center h-12 justify-center w-full gap-2 px-1 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        >
          <div className="aspect-square rounded flex items-center justify-center h-8">
            <FaFacebook className="w-full h-full p-1" />
          </div>
          <div className="pr-2">Facebook</div>
        </button>
      </div>
      <div className="text-gray-400 font-bold">Або</div>
      {!showEmailForm && (
        <button
          type="button"
          onClick={() => setShowEmailForm(true)}
          className="h-10 w-full mb-4 bg-gray-200 rounded hover:bg-gray-300"
        >
          Увійти за допомогою пошти
        </button>
      )}
      {showEmailForm && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-1 mb-4">
          <input
            required
            className="border-b-blue-600 p-2 border-2 rounded"
            onChange={onChange}
            type="email"
            placeholder="Електронна адреса"
          />

          <button
            type="submit"
            disabled={!!emailError || email.length === 0}
            className="h-10 px-3 py-1 bg-emerald-500 cursor-pointer text-white rounded font-bold
                 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed mt-1"
          >
            Продовжити
          </button>
        </form>
      )}
    </div>
  )
}
