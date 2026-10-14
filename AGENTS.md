# BorrowCircle development instructions

## Assessment workflow

This repository is for StartupMeu's Software Engineer Intern MERN assessment.
Use Code0 during development, review its suggestions, and keep factual notes in
`docs/code0-development-log.md`. Installation alone does not count as usage.
All Git/GitHub operations, including initialization, commits, and pushes, must
be run through the Code0 terminal, as required by the assessment. Do not claim
that an ordinary terminal or a separate AI chat satisfies this requirement.
Use small, meaningful commits after working slices are verified.

## Application scope

BorrowCircle is a single-community, free item-lending application. A user can
list an item, request another user's item for 1–14 calendar days, approve or
reject incoming requests, and confirm handover and return. Start with the
vertical slice: register, log in, create an item, and see it in Explore.
Then implement borrowing with database-enforced overlapping-date protection.
Use the agreed plan in `docs/implementation-plan.md`.

## Code conventions

- Use TypeScript for backend, shared code, configuration, and React source.
- Use strict typing; no explicit `any`, unsafe casts to bypass errors, or blanket lint disabling.
- Use React functional components and focused hooks. Avoid unnecessary effects.
- Keep reusable components small. Keep business rules out of JSX.
- Use React Query for server state and React Hook Form for form state.
- Follow backend MVC with separate routes, controllers, services, models,
  middleware, and validation. Controllers stay thin; services own business rules.
- Validate untrusted inputs at runtime. Use explicit writable-field allowlists.
- Use centralized errors, appropriate HTTP status codes, and validated environment configuration.
- Reuse existing components, schemas, types, and utilities before adding new ones.
- Prefer simple conventional code; avoid generic repositories, excessive wrappers,
  speculative abstractions, duplicate logic, and unused files.
- Review typing, dead code, effects, complexity, and architectural boundaries
  before calling a feature complete.

## Testing and teaching

The user has never written an automated test. Teach alongside implementation:
explain simply, show one small TypeScript example, ask for an independent test
or modification, review it, and check understanding. Do not silently generate
a full test suite and call that teaching. Build independent features while an
exercise is pending, but preserve the learning checkpoint.

Start with manual vs automated testing, arrange/act/assert, assertions, and
pass/fail output. Progress through boundaries, async tests, API/auth tests,
isolated test databases, React Testing Library interactions, and mocks.
Use real MongoDB integration tests for transactions and booking races.
Do not treat a mocked database or a successful build as proof of these properties.

## Verification and submission

Track observed results separately from planned checks. Use lint, type checks,
production builds, and meaningful behavior checks. Never claim tests passed
when no tests exist. Keep secrets and local data out of Git. The final README
must include features, stack, setup/run instructions, actual Code0 confirmation,
an AI Development Experience section, and 3–5 specific Code0 tasks with validation.
Keep the repository public for submission only after reviewing tracked files.
