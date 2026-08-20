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
