import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        // 1. Создаем cookieStore как Promise, НЕ вызывая await здесь
        const cookieStore = cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    // 2. Делаем методы асинхронными и вызываем await внутри них
                    async getAll() {
                        return (await cookieStore).getAll()
                    },
                    async setAll(cookiesToSet) {
                        try {
                            const PromiseCookieStore = await cookieStore
                            cookiesToSet.forEach(({ name, value, options }) =>
                                PromiseCookieStore.set(name, value, options)
                            )
                        } catch {
                            // Игнорируем ошибки, если запись вызвана из Server Component
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}?auth-error=oauth_failed`)
}