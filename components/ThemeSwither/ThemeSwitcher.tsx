'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { RiMoonClearLine, RiSunLine } from 'react-icons/ri';
import { HeaderButton } from '../HeaderButton';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  const turnOnSoundRef = useRef<HTMLAudioElement | null>(null);
  const turnOffSoundRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    turnOnSoundRef.current = new Audio('/sounds/lightTurnOn.mp3');
    turnOffSoundRef.current = new Audio('/sounds/lightTurnOff.mp3');

    turnOnSoundRef.current.volume = 0.5;
    turnOffSoundRef.current.volume = 0.5;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      document.body.classList.remove('disable-transitions');
    };
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const toggleTheme = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (currentTheme === 'dark') {
      document.body.classList.add('disable-transitions');
      setTheme('light');
      turnOnSoundRef.current?.play().catch(() => {});
      timeoutRef.current = window.setTimeout(() => {
        document.body.classList.remove('disable-transitions');
        timeoutRef.current = null;
      }, 100);
    } else {
      document.body.classList.add('disable-transitions');
      turnOffSoundRef.current?.play().catch(() => {});
      setTheme('dark');
      timeoutRef.current = window.setTimeout(() => {
        document.body.classList.remove('disable-transitions');
        timeoutRef.current = null;
      }, 100);
    }
  };

  return (
    <>
      <HeaderButton onClickHandler={toggleTheme}>
        {isClient ? (
          currentTheme === 'dark' ? (
            <RiMoonClearLine className='h-5 w-5 dark:text-gray-200' />
          ) : (
            <RiSunLine className='h-5 w-5 text-gray-500' />
          )
        ) : null}
      </HeaderButton>
      {/* <div className='absolute -top-36 right-16 -z-10 h-60 w-60'>
        <svg
          id='Layer_1'
          data-name='Layer 1'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 252.85 570.55'
        >
          <path
            className='fill-gray-50 dark:fill-[#e0d56b]'
            d='M185.64,453.84c2.06,28.73-26.3,61.13-59.98,61.13-36.44,0-64.25-33.25-60.99-64.42,2.15-20.52,15.15-30.42,23.23-45.15,20.32-37.11,2.71-29.91,38.18-28.78,43.64,1.39,16.78,3.14,34.2,24.89,5.28,6.59,22.79,16.65,25.35,52.34Z'
          />
          <path
            className='dark:fill-gray-200'
            d='M124.35,0h2.5v162.53c0,153.93.09,162.56,1.75,163.05,13.49,2.85,9.14,15.4,18.55,14.37,3.77.04,5.34.59,7.35,2.61,3.83,2.58,1.12,8.47,1.37,11.69.29,5.34-.5,10.32.57,15.58,1.29,6.56-5.24,6.61-2.16,14.55,8.2,23.7,35.76,38.64,32.9,69.62,2.53,44.73-48.94,75.6-87.95,56.6-21.88-10.53-36.32-33.01-36.37-56.64-4.9-29.95,44.47-59.6,32.94-78.81-2.03-2.75-2.17-3.53-1.19-6.73,2.09-4.95-2.08-6.94,0-11.62.77-2.04.83-3.67.19-4.87-2.58-5.93.43-11.73,8.16-11.69,10.73.42,4.16-11.87,20.38-14.88.25-81.09.75-244.29,1-325.36h0ZM110.01,510.97c58.75,14.66,99.39-55.82,55.35-102.02-11.63-14.51-13.88-18.98-16.15-30.45l-11.36-.6v47.1c8.21-1.5,16.88,6.24,8.84,13.28-6.26,4.37-13.3-2.38-11.84-9.28h-16.65c-5.55,27.18-32.07-5.82-4.35-4v-47h-13c4.01,20.94-32.39,43.22-33.89,67.64-4.2,28.76,15.06,58,43.05,65.33h0ZM117.85,378v47h16v-47h-16ZM98.9,373.56c3.03,1.28,55.08,4.85,54.95-3.01,4.6-6.05-44.93-2.38-55.5-3.05-.35,1.81-.7,4.65.55,6.06ZM98.53,362.35c.38.37,12.59.56,27.14.42,25.14-.85,30.38,1.38,26.86-5.83-1.89-1.94-3.03-1.94-26.75-1.94-13.62,0-25.48.27-26.35.61-1.58.6-2.22,5.42-.9,6.74ZM99.02,351.13c.73.46,12.62.85,26.43.85,24.07.02,25.17-.06,26.95-2.04,1.43-1.58.76-3.17-.06-4.47,2.74-2.34-43.47-.37-52.62-.97-2.6.18-1.97,5.84-.7,6.63ZM113.17,336.75l-1.33,3.25c4.86-.04,25.9.2,27.01-.55-2.54-11.85-20.94-14.33-25.68-2.7ZM150.85,494.24c-10.1,6.15-13.93,3.08-4.25-1.72,11.76-6.1,19.58-17.15,22.75-32.11,1.62-4.64.36-10.64,3-11.41,6.6,11.48-9.85,40.09-21.5,45.24h0ZM38.66,458.73c-.31,1.61-2.08,1.79-19.65,2.04-18.03.26-19.29.16-18.97-1.5.31-1.61,2.08-1.79,19.65-2.04,18.03-.26,19.29-.16,18.97,1.5ZM127.62,551.49c.07,33.17-4.76,18.13-3.5-7.78.44-18.85,4.22-18.46,3.5,7.78ZM206.85,554.49c0,.83-.4,1.51-.89,1.51-.62-.85-26.16-28.3-23.29-31.39,1.15-.71,24.18,27.74,24.18,29.88ZM252.85,457.5c0,1.28-2.89,1.5-20,1.5s-20-.22-20-1.5,2.89-1.5,20-1.5,20,.22,20,1.5ZM206.51,393.25c-6.33,4.81-11.99,8.75-12.58,8.75-3.11,0,.3-3.51,12.54-12.87,10.33-7.9,13.82-10.08,14.71-9.19,3.42.81-7.38,7.38-14.67,13.31ZM57.35,404.08c0,2.57-2.27,1.64-12.5-5.15-5.58-4.49-19.16-9.9-13.63-11.93,2.14,0,26.13,15.68,26.13,17.08ZM57.8,533.84c-5.03,5.59-9.52,10.16-9.99,10.16-2.66,0-1.27-2.77,4.88-9.71,14.52-17.35,18.46-14.68,5.11-.45h0ZM106.05,434.8c6.81,5.38,11.54-7.65,4.5-6.8-5.01,0-7.52,3.78-4.5,6.8ZM138.89,434.07c1.88,3.52,7.96,1.88,7.96-2.16.64-3.57-13.07-5.09-7.96,2.16ZM134.64,498.87c1.38,1.87-15.52,3.28-13.62.62-1.46-1.72,15.68-3.36,13.62-.62Z'
          />
        </svg>
      </div> */}
    </>
  );
}
