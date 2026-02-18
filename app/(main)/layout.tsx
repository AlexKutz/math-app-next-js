import { GoogleOneTap } from '@/components/auth/GoogleOneTapLogin';
import { Footer } from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className='min-h-screen shadow-[inset_0_-280px_400px_-202px_rgba(70,70,50,0.8)] dark:shadow-amber-200 flex flex-col'>
        <Header />
        <div className='pt-12'></div>
        <div className='m-auto max-w-4xl px-3 sm:px-5 pt-12 sm:pt-22 grow w-full min-h-[calc(100dvh-3rem)] pb-40'>
          {children}
        </div>
        <Footer />
        <GoogleOneTap />
      </div>
    </ErrorBoundary>
  );
}
