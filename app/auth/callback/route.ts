import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Если в будущем понадобится редирект на конкретную страницу, иначе на главную
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Метод setAll может вызываться из Server Components,
                            // где изменять куки напрямую нельзя. Middleware подстрахует.
                        }
                    },
                },
            }
        )

        // Обмениваем временный код (code) на полноценную сессию с куками
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Если произошла ошибка или кода нет в URL, возвращаем на главную с флагом ошибки
    return NextResponse.redirect(`${origin}?auth-error=oauth_failed`)
}