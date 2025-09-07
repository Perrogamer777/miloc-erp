import { type NextRequest } from 'next/server'
import { actualizarSesion } from './app/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await actualizarSesion(request)
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}