'use client'

import { SessionProvider } from 'next-auth/react'
import React from 'react'

//TODO: On prod change refetch on windows focus to true

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
}
