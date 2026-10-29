# Graph Report - .  (2026-10-22)

## Corpus Check
- Corpus is ~8,604 words - fits in a single context window. You may not need a graph.

## Summary
- 176 nodes · 326 edges · 12 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth Middlewares
- Package Metadata
- TilUser Model Service
- App Bootstrap Seeds
- Controllers Routes
- Dependencies
- Errors Client Auth
- Integration Tests
- Admin Auth Service
- Sanitize Middleware

## God Nodes (most connected - your core abstractions)
1. `env` - 12 edges
2. `api()` - 10 edges
3. `AppError` - 9 edges
4. `connectDB()` - 7 edges
5. `disconnectDB()` - 7 edges
6. `scripts` - 6 edges
7. `notFound()` - 6 edges
8. `logger` - 5 edges
9. `TilUser` - 5 edges
10. `setupDb()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `setupDb()` --calls--> `connectDB()`  [EXTRACTED]
  tests/helpers.js → src/config/db.js
- `teardownDb()` --calls--> `disconnectDB()`  [EXTRACTED]
  tests/helpers.js → src/config/db.js
- `clientLogin()` --calls--> `api()`  [EXTRACTED]
  tests/clientAuth.test.js → tests/helpers.js
- `setAccess()` --calls--> `api()`  [EXTRACTED]
  tests/clientAuth.test.js → tests/helpers.js
- `generate()` --calls--> `api()`  [EXTRACTED]
  tests/clientAuth.test.js → tests/helpers.js

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "Auth Middlewares"
Cohesion: 0.11
Nodes (21): authenticate(), authorize(), clientLoginLimiter, globalLimiter, loginLimiter, validate(), router, loginSchema (+13 more)

### Community 1 - "Package Metadata"
Cohesion: 0.10
Nodes (20): author, description, devDependencies, nodemon, supertest, vitest, engines, node (+12 more)

### Community 2 - "TilUser Model Service"
Cohesion: 0.17
Nodes (16): escapeRegex(), generatePassword(), generatePublicId(), nano, TilUser, tilUserSchema, endOfDay(), generateCredentials() (+8 more)

### Community 3 - "App Bootstrap Seeds"
Cohesion: 0.28
Nodes (10): NAMES, app, connectDB(), disconnectDB(), env, parsed, schema, logger (+2 more)

### Community 4 - "Controllers Routes"
Cohesion: 0.13
Nodes (12): asyncHandler(), login, logout, me, refresh, create, generateCredentials, getOne (+4 more)

### Community 5 - "Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, compression, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 6 - "Errors Client Auth"
Cohesion: 0.18
Nodes (10): AppError, errorHandler(), notFound(), login, me, DUMMY_HASH, getMe(), invalidCredentials() (+2 more)

### Community 7 - "Integration Tests"
Cohesion: 0.32
Nodes (12): clientLogin(), generate(), setAccess(), ADMIN, api(), bearer(), CLIENT_HEADER, loginAdmin() (+4 more)

### Community 8 - "Admin Auth Service"
Cohesion: 0.27
Nodes (10): Admin, adminSchema, DUMMY_HASH, getMe(), invalidCredentials(), issueTokens(), login(), publicAdmin() (+2 more)

### Community 9 - "Sanitize Middleware"
Cohesion: 0.83
Nodes (3): clean(), isDangerous(), sanitize()

## Knowledge Gaps
- **57 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `Errors Client Auth` to `Auth Middlewares`, `Admin Auth Service`, `TilUser Model Service`, `Controllers Routes`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `env` connect `App Bootstrap Seeds` to `Auth Middlewares`, `Admin Auth Service`, `Controllers Routes`, `Errors Client Auth`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `TilUser` connect `TilUser Model Service` to `App Bootstrap Seeds`, `Errors Client Auth`, `Integration Tests`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Middlewares` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._
- **Should `Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Controllers Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._