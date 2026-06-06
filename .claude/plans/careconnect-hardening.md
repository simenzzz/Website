# CareConnect — Production-Hardening Plan

> Reconstructed from the audit on 2026-06-06. Versioned in the repo so it's shared with
> the team. Condensed mirror in `.claude/CLAUDE.md` §11; live status tracked in
> Claude's auto-memory (`careconnect-security-todos`, machine-local).
> Line numbers are as of the audit — **verify on touch** (code unchanged since).

## Context

CareConnect (`/home/sami/Website`) is a Lebanon-based pet/baby-sitting marketplace:
React 19 + Vite frontend (`my-app`), Express 5 + TS + PostgreSQL backend (`backend`),
Firebase Auth, Whish Money payments, USD. Fully vibe-coded over ~8 months with no tests
and no consistent style.

**Goal:** real launch with real users + real money, soon.

**Verdict: SALVAGE, do not rewrite.** Foundations are sound — Firebase token-verify
middleware, parameterized SQL everywhere, mostly-correct IDOR ownership checks,
transactional signup. The issues are a handful of concrete security holes plus
maintainability debt. Est. ~2–3 focused weeks to production-ready. Main caveat: **zero
tests**, so add a thin safety net before refactoring the god-files.

---

## STATUS SNAPSHOT (2026-06-06)

- ✅ **C1** leaked key — rotated by user; history purged (`git filter-branch`) +
  force-pushed; verified no reachable blob contains it. Backup bundle at
  `/home/sami/Website-pre-purge-20260606-142016.bundle` (⚠️ still holds the old secret).
- ✅ **C4** `.gitignore` rewritten; `backend/dist/**` + note file untracked. (committed `bb6eb0d`)
- ✅ Project context: root `CLAUDE.md` + `backend/.env.example` + `my-app/.env.example`.
- ⏳ Everything below (C2, C3, H1–H8, M1–M6) is outstanding.

---

## CRITICAL

### C2. Forgeable payment confirmation (test-mode fallback)
`backend/src/routes/payments.ts` — the callback DOES re-verify status server-side with
Whish (good), but the `catch` fallback (~line 282) and the initiate path (~line 167) use
placeholder creds: `WHISH_CHANNEL || 'placeholder_channel'`, `WHISH_SECRET ||
'placeholder_secret'`. When creds are placeholders OR the Whish call throws,
`GET /api/payments/whish/callback?status=success&externalId=<id>` marks the booking
CONFIRMED — a free booking.
- **Fix:** delete both placeholder/test-mode branches; fail-fast at startup if
  `WHISH_CHANNEL`/`WHISH_SECRET`/`WHISH_WEBSITE_URL`/`WHISH_API_URL` are unset; add
  signature/secret verification on the callback if Whish supports it; re-verify the
  charged amount against the booking before COMPLETED.

### C3. Insecure DB fallbacks
`backend/src/config/database.ts` — `password: process.env.DB_PASSWORD || 'password'` and
`ssl: false`.
- **Fix:** require `DB_PASSWORD` (throw if absent); `ssl: { rejectUnauthorized: true }`
  in production. Add one startup env-validation step that fails fast on any missing
  required var (DB_*, FIREBASE_*, WHISH_*, FRONTEND_URL, BACKEND_URL).

---

## HIGH (before launch)

- **H1. Sitter PII exposed unauthenticated.** `backend/src/routes/sitters.ts:8`
  (`/fetchSitters`) has no `verifyToken` — full names + phone numbers + cities, public
  and unthrottled (also N+1 queries). Decide public (cards) vs gated (phone/exact
  location); add `verifyToken` where appropriate, trim the public payload, paginate.
- **H2. No input validation.** Add `zod` schemas at every write boundary (signup,
  profile, children, pets, locations, bookings, payments). Enforce `discount ∈ [0,100]`,
  `priceUsd > 0`, `bookingFrom < bookingTo`, valid dates, string lengths.
- **H3. No rate limiting.** Add `express-rate-limit`, tightest on `/api/auth/*` and
  `/api/payments/*`.
- **H4. Non-transactional booking creation.** `bookings.ts` POST (~line 879+) inserts the
  booking then loops separate INSERTs into `booking_children`/`booking_pets` → orphan risk
  on mid-loop failure. Wrap in `BEGIN/COMMIT/ROLLBACK` (pattern exists in `auth.ts`
  register); use multi-row inserts.
- **H5. Double-booking possible.** No overlap check/constraint on
  `(sitter_id, booking_from, booking_to)`. Add a conflict query inside the transaction
  (ideally a DB exclusion constraint).
- **H6. Error leakage.** Several handlers return `details: error.message` to clients in
  all environments (`auth.ts:264`, `bookings.ts:192/1147`, etc.). Gate `details` behind
  `NODE_ENV === 'development'`; route through the global handler in `server.ts`.
- **H7. Frontend hardcoded config.** `http://localhost:5000/api` is hardcoded in ~6
  service files; Firebase web config hardcoded in `my-app/src/config/firebase.ts`;
  **Google Maps API key hardcoded + committed in `my-app/index.html`** (billable/abusable
  — referrer-restrict it in Google Cloud Console). Move all to `import.meta.env.VITE_*`
  (Vite replaces `%VITE_*%` in index.html) behind one shared API client. `.env.example`
  files already define the var names.
- **H8. No route guards.** Logged-out users reach `/user-portal`, `/sitter-portal`. Add a
  `<ProtectedRoute>` wrapper + a single auth context (replaces ad-hoc auth checks).

---

## MEDIUM (during hardening)

- **M1. God-files** (>800-line rule): `BookingModal.tsx` (1369), `CustomerSignupPage.tsx`
  (1117), `SignupPage.tsx` (949), `auth.ts` (1381), `bookings.ts` (1260). Split by
  responsibility.
- **M2. Duplication.** SignupPage/CustomerSignupPage + LoginPage/CustomerLoginPage
  duplicate validators (`isValidEmail`, `isValidLebanesePhone`, `isOver18`, password
  rules) and Lebanon geo data → extract to `src/utils/validation.ts` + shared data
  module. Backend `auth.ts` repeats "lookup user → lookup customer → check ownership"
  12+ times → extract helpers/middleware.
- **M3. Dead code.** `my-app/src/config/auth.ts` + `my-app/src/config/api.ts` unused;
  `jsonwebtoken` backend dep unused (auth is Firebase-only). Remove; document the one
  auth strategy.
- **M4. ~143 `console.*` + ~55 `any`.** Strip debug logging (real logger server-side);
  tighten the worst `any`s.
- **M5. Migrations.** SQL is ad-hoc in `backend/*.sql`; `create-test-bookings.sql` can
  pollute prod. Move to ordered `backend/migrations/` (or `node-pg-migrate`); keep
  fixtures out of deploy path.
- **M6. Frontend robustness.** No error boundaries; inconsistent loading states;
  `LoginPage` password toggle manipulates the DOM directly instead of React state.

---

## Recommended sequence

1. ✅ Stop the bleeding (C1, C4) — done.
2. **Close security holes** (2–4 days): C2, C3, H1, H2, H3, H6 + startup env validation +
   verify Firebase Storage/Firestore Security Rules (CVs/KYC live there).
3. **Data integrity** (1–2 days): H4, H5, M5.
4. **Make it deployable** (1–2 days): H7, H8 (VITE_* config, shared API client, auth
   context, route guards).
5. **Safety net before refactor** (2–3 days): Vitest + Supertest covering auth, booking
   creation, and the payment callback — include the forged-callback regression test.
6. **Pay down debt** (ongoing): M1–M4, M6.

Per workspace rules, run `everything-claude-code:code-reviewer` +
`everything-claude-code:security-reviewer` (parallel) after each security-touching change;
address CRITICAL/HIGH before declaring done.

## Verification

- **C2:** with real env set, a hand-crafted callback with `?status=success` for a real
  booking must NOT mark it CONFIRMED (re-checks Whish, rejects). Automated regression test.
- **C3/env:** booting with `DB_PASSWORD`/`WHISH_SECRET` unset must crash on startup.
- **Authz:** as user A, read/modify user B's booking/child/pet/location → 403/404.
- **Deploy smoke:** build frontend with `VITE_API_URL` → non-localhost backend; signup →
  login → create booking → pay end-to-end against staging Whish.
- **Builds green:** `cd backend && npm run build`; `cd my-app && npm run build && npm run lint`.

## Reference
- Firebase web `apiKey` is a public client id, NOT a secret — don't treat exposure as a
  breach. Real protection = Security Rules + Firebase Auth.
- Auth docs / API contracts: `backend/BOOKINGS_API.md`, `backend/PAYMENTS_API.md`.
