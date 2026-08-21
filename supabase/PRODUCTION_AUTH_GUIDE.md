# Turning the demo into real authentication

Use Supabase Auth rather than storing passwords in the browser.

## Email/password

Use:

- `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- `supabase.auth.signOut()`

Supabase stores password credentials securely; your application should never store plaintext passwords.

## OAuth

Configure Google, Apple, and Facebook in Supabase Auth. Then use:

`supabase.auth.signInWithOAuth({ provider: 'google' })`

and the corresponding provider name for Apple/Facebook.

## Lockout

The demo shows the requested 3rd/5th-failure UX, but production lockout should be enforced server-side or by the identity provider/rate-limiting layer. Do not rely on JavaScript/localStorage for security.

## Private content

Every private profile/post query must require an authenticated session. The included SQL uses Row Level Security so an unauthenticated client cannot simply query the private tables.

## Mobile

The UI is mobile-first and can later be wrapped with Capacitor or rebuilt as a native iOS/Android client using the same backend/auth model.
