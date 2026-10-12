# Trustix Frontend

Trustix is a Next.js application for secure digital inheritance, encrypted asset vaults, nominee management, and document verification.

## Requirements

- Node.js 18.18 or later
- npm

## Run locally

```sh
npm install
npm run dev
```

The development server runs at `http://localhost:8080` by default. Use a different port when another server is already using it:

```sh
npx next dev -p 8081
```

## Environment variables

Create `frontend/.env` with the public browser-safe values below:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Commands

```sh
npm run dev      # Start the Next development server
npm run build    # Create a production build
npm run start    # Serve the production build
npm run test     # Run the component tests
npm run lint     # Run ESLint
```

## Architecture

- `app/` contains the Next.js App Router entry point, layout, and client providers.
- `src/views/` contains the existing product screens, deliberately kept outside `src/pages/` to avoid activating Next's legacy Pages Router.
- `src/components/`, `src/contexts/`, and `src/lib/` contain shared interface, state, and integration code.
