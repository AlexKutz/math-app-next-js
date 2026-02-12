import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing audio playback functionality
 * Handles initialization and playback of sound effects
 */
export const useAudio = () => {
  const correctAnswerSoundRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Initializes the audio element on component mount
   */
  useEffect(() => {
    correctAnswerSoundRef.current = new Audio('/sounds/correctChoice.mp3');
    
    // Cleanup function to revoke object URLs if needed
    return () => {
      if (correctAnswerSoundRef.current) {
        correctAnswerSoundRef.current = null;
      }
    };
  }, []);

  /**
   * Plays the correct answer sound effect
   */
  const playCorrectAnswerSound = () => {
    correctAnswerSoundRef.current?.play().catch((error) => {
      // Silently handle autoplay restrictions
      console.debug('Audio playback failed:', error);
    });
  };

  return {
    correctAnswerSoundRef,
    playCorrectAnswerSound,
  };
};