# JULibrary

## Project Description
We implemented a web app to explore books, filter results, sort data, and review basic details for each title.
We also implemented login, protected routes, theme switch, and unit tests for key components and hooks.

## Live Link
Live app
https://replace-with-your-live-url

## Main Features
- We implemented search with remote data from Open Library
- We implemented filters by category and several sort options
- We implemented book cards, detail page, and reviews page
- We implemented borrow flow with due date tracking
- We implemented reservation queue for currently borrowed books
- We implemented persistent user loan history in local storage
- We implemented wishlist creation and management for future reading
- We implemented login and logout flow with token persistence
- We implemented light and dark theme switch
- We implemented tests with Vitest and Testing Library

## Tech Stack
- React
- TypeScript
- Vite
- React Router
- Redux Toolkit
- ESLint
- Vitest

## Project Setup
1. Clone the repository
2. Install dependencies
3. Run the frontend in development mode
4. Run tests
5. Build for production

```bash
git clone <repo-url>
cd repositorio
npm install
npm run dev
npm run test
npm run build
```

## Backend and API
The project includes local API code in backend and Azure Functions code in api.
For local login flow, run the backend service in a separate terminal.

```bash
cd backend
npm install
npm start
```

## Environment Variables
Frontend and backend read configuration from `.env` files.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

- `VITE_API_URL` defines the frontend API base URL.
- `WISHLIST_STORAGE_PROVIDER` supports `azure_blob` or `local`.
- `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_BLOB_CONTAINER` are used when provider is `azure_blob`.

## Scripts
- npm run dev starts the frontend
- npm run lint checks code quality
- npm run test runs tests once
- npm run test:watch runs tests in watch mode
- npm run build creates the production build
- npm run preview serves the build locally

## Project Structure
- src contains frontend source code
- src/components contains reusable UI parts
- src/pages contains route pages
- src/context contains auth, theme, and book state contexts
- src/hooks contains custom hooks
- src/test contains unit tests
- backend contains local auth server
- api contains Azure Functions endpoints

## Final Status
We completed final cleanup for lint issues, test warnings, and build validation.
The app is stable for this delivery and ready for the next UI improvement commit.
