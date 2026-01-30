import { GoogleOneTap } from '@/components/auth/GoogleOneTapLogin';
import Header from '@/components/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen shadow-[inset_0_-40px_120px_-120px_rgba(70,70,20,0.8)] dark:shadow-amber-300'>
      <Header />
      <div className='pt-12'></div>
      <div className='m-auto max-w-4xl px-4 py-8 pt-12 sm:pt-28'>
        {children}
      </div>
      <GoogleOneTap />
    </div>
  );
}
