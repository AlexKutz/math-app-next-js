import { GoogleOneTap } from '@/components/auth/GoogleOneTapLogin';
import { Footer } from '@/components/Footer';
import Header from '@/components/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen shadow-[inset_0_-340px_400px_-202px_rgba(70,70,20,0.8)] dark:shadow-amber-300 flex flex-col'>
      <Header />
      <div className='pt-12'></div>
      <div className='m-auto max-w-4xl px-4 pt-12 pb-16 sm:pt-28 grow w-full min-h-[calc(100dvh-3rem)]'>
        {children}
      </div>
      <Footer />
      <GoogleOneTap />
    </div>
  );
}
