import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Permitir acceso público a /, pero proteger rutas privadas
  if (!user && (request.nextUrl.pathname.startsWith('/history') || request.nextUrl.pathname.startsWith('/chatbot') || request.nextUrl.pathname.startsWith('/news') || request.nextUrl.pathname.startsWith('/calendar'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = { matcher: ['/history/:path*', '/chatbot/:path*', '/news/:path*', '/calendar/:path*'] }
