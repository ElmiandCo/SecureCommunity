# E — Secure Community v2

Production-oriented static web app using Supabase Auth + Postgres/RLS and Vercel.

## Features
- Real email/password authentication through Supabase Auth
- Email confirmation support
- Password reset email flow
- Google/Apple/Facebook OAuth hooks (provider must be configured in Supabase)
- Secure persistent sessions handled by Supabase
- Member profiles: first/last name, username, bio, location, website, avatar field
- Authenticated-only community feed
- Create posts
- Edit/delete only your own posts
- Like/unlike posts with database-enforced one-like-per-user-per-post
- Like counters
- Sign-out immediately hides private content
- Mobile-first responsive UI
- Mascot artwork retained

## Security model
The browser never stores passwords. Supabase Auth owns credentials and sessions. Post/profile/like permissions are enforced by PostgreSQL Row Level Security (RLS), not merely by hiding UI controls.

The requested five-failure/5-minute lockout is NOT implemented as client-side security. Client-side counters can be bypassed. Supabase Auth's server-side rate limiting/brute-force protections are the security boundary. If an exact five-attempt/5-minute business rule is required later, implement it in a trusted server-side authentication layer rather than JavaScript.

## Vercel setup
The Vercel project should have these environment variables in the deployment environment:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://njilnqgdfrvpvgbkodwl.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase Publishable key

Never put the Supabase secret/service-role key in the browser or Vercel client environment.

The build script creates `dist/config.js` from those environment variables. Vercel deploys `dist/`.

## Supabase Auth redirect
In Supabase Auth URL Configuration:
- Site URL: `https://esecureprofilecommunityv1.vercel.app`
- Redirect URLs should include: `https://esecureprofilecommunityv1.vercel.app`

Google OAuth provider should use Supabase's generated callback URL as the Google Cloud redirect URI. The application sends the Vercel URL as the post-login redirect.


## V3 deployment fix
The build script is at the repository root as `build.mjs` so GitHub web uploads cannot accidentally omit a nested scripts directory. Vercel runs `npm run build` and publishes `dist/`.


## V4 profile-auth fix

The production database now creates a `profiles` row automatically whenever a new
Supabase Auth user is created. The frontend also defensively creates the profile
with an upsert if an older account has no profile row.

Google OAuth redirects back to the current production origin. Keep Supabase
Authentication > URL Configuration pointed at the production Vercel URL and keep
the Google provider's Authorized Redirect URI pointed at the Supabase callback URL.

Never expose a Supabase secret/service-role key in the browser.


## V5 account behavior

For immediate account creation and sign-in without waiting for an email, Supabase
Authentication must have **Confirm email disabled**. This is a Supabase project
setting, not a browser-side setting.

If email verification is required for production, enable Confirm email and configure
custom SMTP. The frontend will then correctly tell the user that confirmation is
required rather than pretending an email was sent.

Google OAuth returns to the current production origin and the frontend ensures a
profile exists for every authenticated user. The database trigger is also installed
in the production project as a second line of defense.

Never expose a Supabase secret/service-role key in browser code.


## V6 community expansion

- Forgot-password flow now sends a Supabase recovery email and presents a secure new-password screen after the recovery link is opened.
- Usernames are checked before signup and protected by a case-insensitive unique database index.
- Posts support up to 4 private photos/videos per post (50 MB per file).
- Authenticated members can comment on posts and attach photos/videos to comments.
- Media lives in a private Supabase Storage bucket with authenticated RLS policies.
- Media-only posts/comments are supported.
- Community UI theme updated to a secure dark navy/cyan style.

The production Supabase migration is included at `supabase/migrations/20260825_community_v6.sql`.
