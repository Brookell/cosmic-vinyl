# Supabase User Spaces Design

## Goal

Move Cosmic Vinyl from browser-only music spaces to signed-in personal spaces:

- A user can sign in.
- Each signed-in user owns one or more music spaces.
- Each space keeps its own track list and visual settings.
- Existing local spaces can be migrated into the user's account after sign-in.

Sharing is intentionally out of scope for this phase.

## Recommended Auth Flow

Start with Supabase Auth email magic link / OTP because it is low-friction and avoids password UI complexity in this prototype.

Later options:

- Email and password
- Google sign-in
- Anonymous user upgraded to email account

## Data Model

### `profiles`

Stores lightweight user-facing profile data. The primary key matches `auth.users.id`.

Fields:

- `id`
- `display_name`
- `created_at`
- `updated_at`

### `music_spaces`

One row per user-created music space.

Fields:

- `id`
- `user_id`
- `name`
- `settings`
- `created_at`
- `updated_at`

`settings` stores UI and visual preferences such as background brightness and scene brightness.

### `space_tracks`

One row per track in a space.

Fields:

- `id`
- `space_id`
- `position`
- `name`
- `artist`
- `album`
- `duration`
- `preview_url`
- `artwork_url`
- `itunes_query`
- `is_custom`
- `metadata`
- `created_at`
- `updated_at`

Local uploaded audio files should stay local for now. Cloud audio upload would be a later Supabase Storage phase.

## Security Model

Enable Row Level Security on every public table.

Policies:

- Users can select/update only their own profile.
- Users can CRUD only their own music spaces.
- Users can CRUD tracks only inside spaces they own.

Do not store authorization decisions in user-editable metadata.
Do not expose any service role key in the frontend.

## Client Integration Plan

1. Add a Supabase client module using a publishable key.
2. Add a compact account button in the top bar.
3. Add an auth modal with email input.
4. On sign-in:
   - Load the user's spaces from Supabase.
   - If cloud has no spaces, offer to upload the current local space.
   - If local and cloud both exist, let the user choose "keep local", "use cloud", or "merge later".
5. On space change:
   - Save the active space to Supabase when signed in.
   - Continue using localStorage when signed out.
6. Use debounced saves for frequent visual setting changes.

## First Implementation Milestone

Minimal cloud MVP:

- Auth modal
- Sign in / sign out
- Load spaces from Supabase
- Create space in Supabase
- Save track list and visual settings per space
- Local fallback when signed out

## Open Decisions

- Whether sign-in should be magic link only or include password.
- Whether local uploaded audio files should be disabled for cloud spaces until Storage is added.
- Whether cloud save should happen automatically or through an explicit "Save" action.
