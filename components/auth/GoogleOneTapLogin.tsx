'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
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
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const isInitialized = useRef(false); // Флаг для отслеживания инициализации

  const handleCredentialResponse = useCallback(async (response: any) => {
    await signIn('google-onetap', {
      credential: response.credential,
      redirect: false,
    });
  }, []);

  const initializeGoogleOneTap = useCallback(() => {
    if (window.google && !session) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleCredentialResponse,
          ux_mode: 'popup',
          // use_fedcm_for_prompt: true,
          auto_select: false,
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log(
              'One Tap was not displayed:',
              notification.getNotDisplayedReason()
            );
          } else if (notification.isSkippedMoment()) {
            console.log(
              'One Tap was skipped:',
              notification.getSkippedReason()
            );
          } else if (notification.isDismissedMoment()) {
            console.log(
              'One Tap was dismissed:',
              notification.getDismissedReason()
            );
          }
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes(
            'Only one navigator.credentials.get request may be outstanding at one time'
          )
        ) {
          console.log(
            'FedCM request already in progress. Waiting before retrying...'
          );
          // eslint-disable-next-line react-hooks/immutability
          setTimeout(initializeGoogleOneTap, 1000);
        } else {
          console.error('Error initializing Google One Tap:', error);
        }
      }
    }
  }, [session, handleCredentialResponse]);

  useEffect(() => {
    if (isGoogleScriptLoaded) {
      initializeGoogleOneTap();
    }
  }, [isGoogleScriptLoaded, initializeGoogleOneTap]);

  useEffect(() => {
    if (session) {
      // If user is signed in, cancel any ongoing One Tap prompts
      window.google?.accounts.id.cancel();
    }
  }, [session]);

  // useEffect(() => {
  //   const script = document.createElement('script')
  //   script.src = 'https://accounts.google.com/gsi/client'
  //   script.async = true
  //   script.defer = true
  //   document.body.appendChild(script)

  //   script.onload = () => {
  //     window.google.accounts.id.initialize({
  //       client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  //       callback: async (response) => {
  //         await signIn('google-onetap', {
  //           credential: response.credential,
  //           redirect: false,
  //         })
  //       },
  //     })

  //     window.google.accounts.id.prompt()
  //   }
  // }, [])

  return (
    <Script
      src='https://accounts.google.com/gsi/client'
      async
      defer
      onLoad={() => setIsGoogleScriptLoaded(true)}
      strategy='afterInteractive'
    />
  );
}
