import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/utils'

export default async function middleware(request: NextRequest) {
  const user = await getSession()
  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith('/dashboard')) {
    const referer = request.headers.get('referer')

    const targetUrl = referer ? new URL(referer) : new URL('/', request.url)

    targetUrl.searchParams.set('login', 'true')

    return NextResponse.redirect(targetUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
