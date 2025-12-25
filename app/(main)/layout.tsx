import { GoogleOneTap } from '@/components/auth/GoogleOneTapLogin'
import Header from '@/components/Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <GoogleOneTap />
    </>
  )
}
