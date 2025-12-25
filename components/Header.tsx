import Link from 'next/link'
import { getSession } from '@/lib/auth/utils'
import Image from 'next/image'
import { AuthControls } from './tasks/AuthControls'
import { UserMenu } from './UserMenu'

export default async function Header() {
  const session = await getSession()
  const user = session?.user

  return (
    <header className="py-2 px-8 flex justify-center items-center border-b border-gray-300">
      <div></div>
      <nav className="flex gap-3 items-center h-12">
        <UserMenu />
      </nav>
    </header>
  )
}
