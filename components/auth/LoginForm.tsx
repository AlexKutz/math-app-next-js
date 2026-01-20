'use client';

import { handleEmailSignIn } from '@/lib/auth/emailSignInServerAction';
import { handleFacebookSignIn } from '@/lib/auth/facebookSignInServerAction';
import { isValidEmail } from '@/lib/validation/email';
import { ChangeEvent, useState } from 'react';
import { FaGithub, FaFacebook } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { signIn, useSession } from 'next-auth/react';

export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<null | string>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const { update } = useSession();

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
    <div className='space-y-4 font-sans'>
      <h1 className='mb-3 text-center font-sans text-3xl font-bold text-gray-600'>
        Увійти
      </h1>
      <div className='my-8 mb-16'>
        <div className='absolute left-0 flex h-0.5 w-full items-center justify-center bg-gray-300 text-center'>
          <div className='w-36 bg-white text-center font-bold text-gray-400'>
            За допомогою
          </div>
        </div>
      </div>
      <div className='social-logins flex flex-col gap-3'>
        <button
          onClick={signInWithPopup.bind(null, 'google')}
          className='flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded bg-blue-500 px-1 py-1 text-white hover:bg-blue-600'
        >
          <div className='flex aspect-square h-8 items-center justify-center rounded'>
            <FcGoogle className='h-full w-full p-1' />
          </div>
          <div className='pr-2'>Google</div>
        </button>
        <button
          onClick={signInWithPopup.bind(null, 'github')}
          className='flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded bg-blue-500 px-1 py-1 text-white hover:bg-blue-600'
        >
          <div className='flex aspect-square h-8 items-center justify-center rounded'>
            <FaGithub className='h-full w-full p-1' />
          </div>
          <div className='pr-2'>Github</div>
        </button>
        <button
          onClick={signInWithPopup.bind(null, 'facebook')}
          className='flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded bg-blue-500 px-1 py-1 text-white hover:bg-blue-600'
        >
          <div className='flex aspect-square h-8 items-center justify-center rounded'>
            <FaFacebook className='h-full w-full p-1' />
          </div>
          <div className='pr-2'>Facebook</div>
        </button>
      </div>
      <div className='font-bold text-gray-400'>Або</div>
      {!showEmailForm && (
        <button
          type='button'
          onClick={() => setShowEmailForm(true)}
          className='mb-4 h-10 w-full rounded bg-gray-200 hover:bg-gray-300'
        >
          Увійти за допомогою пошти
        </button>
      )}
      {showEmailForm && (
        <form onSubmit={handleEmailSubmit} className='mb-4 flex flex-col gap-1'>
          <input
            required
            className='h-12 rounded border-2 border-b-blue-600 p-2'
            onChange={onChange}
            type='email'
            placeholder='Електронна адреса'
          />

          <button
            type='submit'
            disabled={!!emailError || email.length === 0}
            className='mt-1 h-12 cursor-pointer rounded bg-emerald-500 px-3 py-1 font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500'
          >
            Продовжити
          </button>
        </form>
      )}
    </div>
  );
};
