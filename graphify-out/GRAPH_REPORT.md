# Graph Report - TIL_Backend  (2026-10-29)

## Corpus Check
- 63 files · ~19,393 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 302 nodes · 645 edges · 13 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96c0b909`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- maneuverTracking.js

## God Nodes (most connected - your core abstractions)
1. `asBody()` - 18 edges
2. `TilUser` - 17 edges
3. `env` - 14 edges
4. `AppError` - 12 edges
5. `api()` - 12 edges
6. `sanitizeString()` - 10 edges
7. `upper()` - 10 edges
8. `badRequest()` - 10 edges
9. `createId()` - 10 edges
10. `notFound()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `setupDb()` --references--> `TilUser`  [EXTRACTED]
  tests/helpers.js → src/modules/til-users/tilUser.model.js
- `teardownDb()` --references--> `TilUser`  [EXTRACTED]
  tests/helpers.js → src/modules/til-users/tilUser.model.js
- `setupDb()` --calls--> `connectDB()`  [EXTRACTED]
  tests/helpers.js → src/config/db.js
- `teardownDb()` --calls--> `disconnectDB()`  [EXTRACTED]
  tests/helpers.js → src/config/db.js
- `createManeuverService()` --calls--> `computeLocationUpdate()`  [EXTRACTED]
  src/modules/forwarder/application/maneuverService.js → src/modules/forwarder/domain/maneuverTracking.js

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "Auth Middlewares"
Cohesion: 0.08
Nodes (28): authenticate(), authorize(), clientLoginLimiter, globalLimiter, loginLimiter, monitorLimiter, validate(), router (+20 more)

### Community 1 - "Package Metadata"
Cohesion: 0.05
Nodes (36): author, dependencies, bcryptjs, compression, cookie-parser, cors, dotenv, express (+28 more)

### Community 2 - "TilUser Model Service"
Cohesion: 0.16
Nodes (22): escapeRegex(), generatePassword(), generatePublicId(), nano, DUMMY_HASH, getMe(), invalidCredentials(), login() (+14 more)

### Community 3 - "App Bootstrap Seeds"
Cohesion: 0.12
Nodes (28): NAMES, app, connectDB(), disconnectDB(), env, parsed, schema, logger (+20 more)

### Community 4 - "Controllers Routes"
Cohesion: 0.09
Nodes (21): AppError, errorHandler(), notFound(), asyncHandler(), login, logout, me, refresh (+13 more)

### Community 5 - "Dependencies"
Cohesion: 0.09
Nodes (25): sanitizeCurp(), clientService, isOperatorToken(), maneuverService, requireOperator, requireOperatorOrUser(), requireUser, routeService (+17 more)

### Community 6 - "Errors Client Auth"
Cohesion: 0.19
Nodes (16): createClientService(), createManeuverService(), createRouteService(), createTransporterService(), ECO_SPEC, OPERATOR_SPEC, AppError, badRequest() (+8 more)

### Community 7 - "Integration Tests"
Cohesion: 0.17
Nodes (21): asBody(), clientDeleteDto(), clientDto(), ecoDto(), keyLoginDto(), loginDto(), maneuverDeleteDto(), maneuverDto() (+13 more)

### Community 8 - "Admin Auth Service"
Cohesion: 0.38
Nodes (8): DUMMY_HASH, getMe(), invalidCredentials(), issueTokens(), login(), publicAdmin(), refresh(), sha256()

### Community 9 - "Sanitize Middleware"
Cohesion: 0.30
Nodes (11): isPlainObject(), sanitizeContainers(), sanitizeEmail(), sanitizeEvents(), sanitizeLocationEvents(), sanitizeLocationPoint(), sanitizeName(), sanitizeObject() (+3 more)

### Community 12 - "maneuverTracking.js"
Cohesion: 0.67
Nodes (5): computeLocationUpdate(), buildRouteMilestones(), findRoutePoint(), listPoints(), normalizeLegacyRoute()

## Knowledge Gaps
- **67 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TilUser` connect `TilUser Model Service` to `App Bootstrap Seeds`, `Dependencies`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `AppError` connect `Controllers Routes` to `Auth Middlewares`, `Admin Auth Service`, `TilUser Model Service`, `Dependencies`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `env` connect `App Bootstrap Seeds` to `Auth Middlewares`, `TilUser Model Service`, `Controllers Routes`, `Dependencies`, `Admin Auth Service`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Middlewares` be split into smaller, more focused modules?**
  _Cohesion score 0.08292682926829269 - nodes in this community are weakly interconnected._
- **Should `Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `App Bootstrap Seeds` be split into smaller, more focused modules?**
  _Cohesion score 0.12070874861572536 - nodes in this community are weakly interconnected._