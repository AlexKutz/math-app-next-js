import { GoogleOneTap } from '@/components/auth/GoogleOneTapLogin';
import Header from '@/components/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='h-screen shadow-[inset_0_-40px_120px_-120px_rgba(70,70,20,0.8)] dark:shadow-amber-300'>
      <Header />
      <div className='pt-32'></div>
      <div className='m-auto max-w-5xl px-12 py-5'>{children}</div>
      <GoogleOneTap />
    </div>
  );
}
