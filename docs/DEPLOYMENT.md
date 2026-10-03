# Local production run

Create `.env.local`, run `npm run build`, and then run `npm start`. The server listens only on `127.0.0.1:3000`.

Before an update, copy `data/` and `public/uploads/`. After the update, run the type check, tests, build, and verify `/api/health` before resuming editorial work.
