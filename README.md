# One Muslim — Social Community V2

GitHub-ready prototype combining the strongest pieces of the supplied projects:

- One Muslim-inspired bright visual direction is the master design language.
- Google/Supabase authentication integration point from the secure profile app.
- Community feed and member profile foundation.
- Avatar Creator V1 using the supplied layered 1254×1254 PNG assets.
- Edit Profile with city, state/province, country and city-level Muslim Map visibility.
- Muslim Map interaction inspired by the supplied daycare movement map: filters, live-looking pulsing markers and result list.
- Events and new-revert journey entry points.
- Supabase schema for profiles, posts and events.

## Run locally

Because this is a static site, you can serve it with any static server. Do not open `index.html` from `file://` if you plan to use Supabase OAuth.

Example:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Connect Supabase

1. Create/configure a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Enable Google under Supabase Authentication → Providers.
4. Put the project URL and anon key in `config.js`.
5. Add your GitHub Pages / deployment URL to the Supabase Auth redirect URL allow-list.
6. Never place a service-role key in the browser project.

## GitHub

This repository is intentionally simple: no build step and no generated dependencies. Upload the project contents to GitHub as-is.

## V1 boundaries

The avatar is intentionally 2D layered PNG composition for now. The architecture leaves room for later 3D environments, cars, accessories, shared spaces and richer social experiences without requiring the first release to become a game engine.

The Muslim Map is intentionally city-level in V1. Do not expose exact home addresses or precise user coordinates.
