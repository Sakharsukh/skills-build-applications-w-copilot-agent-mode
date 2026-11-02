# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Build React routes and components that fetch only through the shared API client, and render accessible loading, success, empty, and error states.
- Logic tier decision: Use Express routes for `/api/*` contracts and keep validation, aggregation, and recommendation behavior in explicit TypeScript service functions.
- Data tier decision: Define required fields and relationships in Mongoose schemas, then seed stable demo records with upserts without deleting unrelated user data.
- Activity tracking approach: Validate ObjectIds and reference existing users and teams; create activities with computed points and timestamps, and expose list and create operations.
- Team management approach: Require team names and mascots, default members to an empty array, preserve submitted members, and return deliberate 4xx responses for invalid team input.
- Leaderboard approach: Sum activity points by team, sort descending, and attach a 1-based rank before returning the leaderboard through the API.
- Workout suggestions approach: Match the requested email to a user, infer a matching fitness focus from goals or recent activity types, and return workout suggestions with evidence-based reasons or a deliberate 4xx for unknown users.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - Failures indicate missing Mongoose validation, relationships, seed data, or idempotency behavior in the data tier.
- API command: `npm run test:api --prefix octofit-tracker/backend` - Failures indicate incomplete routes or services, incorrect response shapes/statuses, invalid-input handling, leaderboard aggregation, or workout recommendations.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - Failures indicate missing API-client use, route rendering, accessible content, or loading/empty/error state handling in the presentation tier.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - Failures indicate TypeScript errors in the Express, service, model, or database implementation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - Failures indicate TypeScript, React, routing, or Vite integration errors in the presentation tier.
