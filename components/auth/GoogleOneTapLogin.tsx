'use client';

import { useEffect, useCallback, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Script from 'next/script';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          cancel: () => void;
          revoke: (hint: string, callback: () => void) => void;
        };
      };
    };
  }
}

export function GoogleOneTap() {
  const { data: session } = useSession();

  const initializedRef = useRef(false);
  const promptedRef = useRef(false);

  const handleCredentialResponse = useCallback(async (response: any) => {
    await signIn('google-onetap', {
      credential: response.credential,
      redirect: false,
    });
  }, []);

  const initializeGoogleOneTap = useCallback(() => {
    if (!window.google || session) return;

    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
        ux_mode: 'popup',
        // use_fedcm_for_prompt: true,
        auto_select: false,
      });
    }

    if (!promptedRef.current) {
      window.google.accounts.id.prompt((notification: any) => {
        console.log('[GoogleOneTap] Prompt notification:', {
          isDisplayed: notification.isDisplayed(),
          isNotDisplayed: notification.isNotDisplayed(),
          isSkippedMoment: notification.isSkippedMoment(),
          isDismissedMoment: notification.isDismissedMoment(),
          getNotDisplayedReason: notification.getNotDisplayedReason?.(),
          getSkippedReason: notification.getSkippedReason?.(),
          getDismissedReason: notification.getDismissedReason?.(),
        });
      });
      promptedRef.current = true;
    }
  }, [session, handleCredentialResponse]);

  useEffect(() => {
    initializeGoogleOneTap();
  }, [initializeGoogleOneTap]);

  useEffect(() => {
    if (session && window.google) {
      window.google.accounts.id.cancel();
      promptedRef.current = false;
    }
  }, [session]);

  return (
    <Script
      src='https://accounts.google.com/gsi/client'
      async
      defer
      strategy='afterInteractive'
    />
  );
}
