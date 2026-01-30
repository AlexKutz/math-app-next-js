'use client';

import { handleEmailSignIn } from '@/lib/auth/emailSignInServerAction';
import { handleFacebookSignIn } from '@/lib/auth/facebookSignInServerAction';
import { isValidEmail } from '@/lib/validation/email';
import { ChangeEvent, useState } from 'react';
import { FaGithub, FaFacebook } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { signIn, useSession } from 'next-auth/react';
import { RiMailCheckLine } from "react-icons/ri";

export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<null | string>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const { update } = useSession();

  const baseButtonClasses = 'group relative flex h-14 w-full cursor-pointer items-center justify-center gap-3.5 overflow-hidden rounded-xl border-2 border-border bg-background px-6 py-3 font-semibold text-foreground shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98]';
  const iconContainerClasses = 'relative flex h-10 w-10 items-center justify-center rounded-lg p-2 shadow-sm';
  const gradientOverlayClasses = 'absolute inset-0 bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100';

  const signInWithPopup = (providerId: 'google' | 'github' | 'facebook') => {
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      `/auth/signin-popup?provider=${providerId}`,
      'OAuth SignIn',
      `width=${width},height=${height},top=${top},left=${left}`,
    );

    // FALLBACK:
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.warn('Popup blocked! Redirecting instead...');
      signIn(providerId, { callbackUrl: '/' });
      return;
    }

    const handler = async (event: MessageEvent) => {
      if (event.data === 'signin-success') {
        onSuccess();

        await update();

        popup?.close();

        window.removeEventListener('message', handler);
      }
    };

    window.addEventListener('message', handler);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isValidEmail(e.target.value)) {
      setEmail(e.target.value);
      setEmailError(null);
    } else {
      setEmailError('Invalid email address');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleEmailSignIn(email);
  };

  return (
    <div className='mt-5 space-y-4'>
      <h1 className='mb-3 text-center text-3xl font-bold text-foreground'>
        Увійти
      </h1>
      <div className='my-8 mb-16'>
        <div className='absolute left-0 flex h-0.5 w-full items-center justify-center bg-border text-center'>
          <div className='w-36 bg-background text-center font-bold text-muted-foreground'>
            За допомогою
          </div>
        </div>
      </div>
      <div className='social-logins flex flex-col gap-3.5'>
        <button
          onClick={signInWithPopup.bind(null, 'google')}
          className={`${baseButtonClasses} hover:border-primary/30`}
        >
          <div className={`${gradientOverlayClasses} via-primary/5`} />
          <div className={`${iconContainerClasses} bg-white`}>
            <FcGoogle className='h-full w-full' />
          </div>
          <div className='relative text-base'>Continue with Google</div>
        </button>
        <button
          onClick={signInWithPopup.bind(null, 'github')}
          className={`${baseButtonClasses} hover:border-[#333]/50 dark:hover:border-[#f0f6fc]/30`}
        >
          <div className={`${gradientOverlayClasses} via-[#333]/5 dark:via-[#f0f6fc]/5`} />
          <div className={`${iconContainerClasses} bg-[#24292e] dark:bg-[#f0f6fc]`}>
            <FaGithub className='h-full w-full text-white dark:text-[#24292e]' />
          </div>
          <div className='relative text-base'>Continue with Github</div>
        </button>
        <button
          onClick={signInWithPopup.bind(null, 'facebook')}
          className={`${baseButtonClasses} hover:border-[#1877f2]/30`}
        >
          <div className={`${gradientOverlayClasses} via-[#1877f2]/5`} />
          <div className={`${iconContainerClasses} bg-[#1877f2]`}>
            <FaFacebook className='h-full w-full text-white' />
          </div>
          <div className='relative text-base'>Continue with Facebook</div>
        </button>
      </div>
      <div className='font-bold text-muted-foreground'>Або</div>
      {!showEmailForm && (
        <button
          type='button'
          onClick={() => setShowEmailForm(true)}
          className='mb-4 flex items-center justify-center gap-2 h-10 w-full rounded bg-muted text-foreground hover:bg-muted/80 shadow-sm'
        >
          <RiMailCheckLine className='h-6 w-6' /> Увійти за допомогою пошти
        </button>
      )}
      {showEmailForm && (
        <form onSubmit={handleEmailSubmit} className='mb-4 flex flex-col gap-1'>
          <input
            required
            className='h-12 rounded border-2 border-border bg-background p-2 focus:border-primary focus:outline-none'
            onChange={onChange}
            type='email'
            placeholder='Електронна адреса'
          />

          <button
            type='submit'
            disabled={!!emailError || email.length === 0}
            className='mt-1 h-12 cursor-pointer rounded bg-primary px-3 py-1 font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Продовжити
          </button>
        </form>
      )}
    </div>
  );
};
