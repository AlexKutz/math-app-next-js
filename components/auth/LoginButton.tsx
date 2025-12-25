'use client'

import { LoginModal } from '@/components/auth/LoginModal'
import { useSearchParams } from 'next/navigation'

import { useRouter, usePathname } from 'next/navigation'
import { IoLogInOutline } from 'react-icons/io5'

export const LoginButton = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const showLogin = searchParams.get('login') === 'true'

  const openLogin = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('login', 'true')

    router.push(`${pathname}?${params.toString()}`)
  }

  const closeLogin = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('login')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <button
        className="flex gap-2 items-center cursor-pointer text-lg bg-blue-500 text-white py-2.5 px-4 rounded hover:bg-blue-600 transition"
        onClick={openLogin}
      >
        <IoLogInOutline className="w-6 h-6" />
        Увійти
      </button>
      {showLogin && <LoginModal onClose={closeLogin} />}
    </>
  )
}
