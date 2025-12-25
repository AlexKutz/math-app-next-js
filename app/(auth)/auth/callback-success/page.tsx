'use client';
import { useEffect } from 'react';

export default function CallbackSuccess() {
  useEffect(() => {
    window.opener.postMessage('signin-success', window.location.origin);
  }, []);

  return (
    <div className='h-screen flex flex-col items-center justify-center gap-3'>
      <div className='flex gap-6 items-center'>
        <span className='text-2xl font-bold'>Успішно!</span>{' '}
        <span className='text-8xl text-green-600 mb-8'>✓</span>
      </div>
    </div>
  );
}
