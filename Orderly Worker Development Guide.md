# Orderly Worker Development Guide

**Status:** Living Guide  
**Audience:** Orderly maintainers, contributors, third-party developers, and users building Workers  
**Role:** Practical companion to the draft Worker specifications

---

## 1. Purpose

Orderly Worker is the extension platform for adding applications, automation, integrations, AI behavior, data models, and custom interfaces to Orderly without merging every feature into Orderly Core.

All Workers—whether developed by Orderly, a contributor, or an Orderly user—are developed and versioned in the dedicated `worker` repository. A validated Worker release can then be published to Worker Store, discovered by users, and installed as isolated Worker Instances. Each user may own at most one instance of a given Worker Definition, while a Worker Definition may still have many instances owned by different users across the platform.

This guide turns the existing draft specifications into a practical development direction. The specifications remain important references, but they are not treated as proof that every described capability already exists. During development, documentation MUST follow the real implementation. If implementation and a draft document disagree, the difference must be recorded and resolved deliberately.

The intended experience is:

```text
Developer
   │
   ▼
Create Worker from template
   │
   ▼
Implement behavior, UI, data, and integrations
   │
   ▼
Validate and test in an isolated environment
   │
   ▼
Submit a versioned release
   │
   ▼
Worker Store review and publication
   │
   ▼
User installs a Worker Instance
```

---

## 2. Product Vision

Workers allow Orderly to grow without turning Orderly Core into a collection of tightly coupled feature modules.

A Worker may provide:

- conversational behavior in Orderly Chat;
- a custom Workspace interface;
- business rules and automation;
- API handlers and webhooks;
- scheduled or background work;
- Worker-owned data models;
- integration with external services;
- Orderly-managed AI or a publisher/user-provided AI API;
- controlled interaction with other Workers;
- realtime collaboration between authorized users.

Users and contributors should not need to add Vue pages, Phoenix controllers, Ecto schemas, or database migrations directly to Orderly for each new Worker. Orderly provides the shell, runtime, identity, authorization, capabilities, communication, and lifecycle. The Worker provides its own product behavior.

---

## 3. Sources of Truth

Desain Worker sistem bawaan, inbox notifikasi, action akun, dan activity history dibahas dalam `Orderly Assistant Design Guide.md`. Dokumen tersebut adalah panduan tambahan; jika bertentangan dengan security boundary pada Permission atau Runtime Specification, aturan yang lebih ketat berlaku.

Worker development uses three levels of documentation:

1. **Implemented contract** — behavior covered by code and tests. This is authoritative for the current release.
2. **Accepted specification** — a reviewed contract scheduled for or supported by a platform version.
3. **Draft proposal** — a design reference that may change before implementation.

Every document and capability should state its status. Avoid describing a proposed API as already available.

Use the following labels:

```text
Implemented      Available and verified by tests
Experimental     Available, but may change
Planned          Accepted direction, not yet available
Proposal         Under discussion
Deprecated       Supported temporarily with a migration path
```

The existing Worker, Manifest, Runtime, Permission, and SDK specifications are currently draft references. They provide the architectural foundation, but their details must be validated against real development needs.

---

## 4. Core Architecture

The permanent separation is:

```text
UNTRUSTED / WORKER CONTROLLED

Worker source
Worker dependencies
Worker UI
Worker input
External API responses

              │
              ▼

ORDERLY WORKER BOUNDARY

Package validator
Worker Gateway
Worker Runtime
Permission engine
Capability APIs
UI bridge
Event delivery

              │
              ▼

TRUSTED / ORDERLY CONTROLLED

Authentication
Users
Chat
Worker registry
Worker Store
Worker instances
Orderly database
Secrets
Billing and limits
Audit logs
```

A Worker MUST NOT import Orderly Core internals, receive Core database credentials, register arbitrary Core routes, access host files, or read another instance's private state.

Official Orderly Workers should use the same public contracts as community Workers whenever practical. Privileged internal APIs should be exceptional, documented, and unavailable to third parties unless made into a reviewed capability.

---

## 5. Repository Model

The `worker` repository is the development home for:

- the Worker SDK;
- the local development runtime;
- manifest schemas and validators;
- reusable UI/runtime packages;
- Worker templates;
- official Workers;
- contributed Workers;
- examples and conformance tests;
- Worker platform documentation.

Recommended repository structure:

```text
worker/
├── docs/
│   ├── specifications/
│   ├── guides/
│   ├── decisions/
│   └── compatibility/
├── packages/
│   ├── sdk/
│   ├── manifest-schema/
│   ├── validator/
│   ├── dev-runtime/
│   ├── ui-runtime/
│   └── testing/
├── templates/
│   ├── basic/
│   ├── chat-worker/
│   ├── workspace-worker/
│   ├── ai-worker/
│   └── external-service-worker/
├── workers/
│   ├── orderly/
│   ├── community/
│   └── examples/
├── tooling/
└── README.md
```

This is a target structure. It should be introduced incrementally as the first working SDK, validator, runtime, and Worker are built.

---

## 6. Standard Worker Template

Every Worker should begin from a common template rather than inventing its own package layout.

Recommended Worker structure:

```text
workers/<publisher>/<worker-slug>/
├── orderly.worker.json
├── package.json
├── README.md
├── CHANGELOG.md
├── src/
│   ├── index.ts
│   ├── handlers/
│   │   ├── chat.ts
│   │   ├── events.ts
│   │   └── routes.ts
│   ├── services/
│   ├── domain/
│   └── integrations/
├── workspace/
│   ├── index.ts
│   └── assets/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── permissions/
└── assets/
    ├── icon.png
    └── banner.png
```

Not every directory is required. A chat-only Worker may omit `workspace/`. A UI-only Worker may have minimal backend handlers. The template generator should ask which capabilities are needed and create only the relevant files.

Business logic should live in `domain/` or `services/`, not directly inside chat and route handlers. This lets chat, Workspace, API, AI, and Worker-to-Worker actions share the same tested behavior.

---

## 7. Worker Store and Publication

Worker Store displays publishable Worker Definitions. It does not display arbitrary branches or every file in the repository.

Publication should follow this flow:

```text
Repository Worker
   │
   ▼
Build immutable artifact
   │
   ▼
Manifest and package validation
   │
   ▼
Dependency and security analysis
   │
   ▼
Permission review
   │
   ▼
Automated conformance tests
   │
   ▼
Isolated test instance
   │
   ▼
Publisher/reviewer approval
   │
   ▼
Worker Store release
```

Each release must have a version, content hash, publisher identity, compatibility range, permission list, review status, and immutable artifact. Updating an existing version in place is prohibited.

Workers created by users may initially remain private or unlisted. Public publication requires validation and review regardless of whether the publisher is Orderly, a contributor, or a user.

---

## 7.1 Instance Ownership and Public Naming

Every instance has an immutable internal UUID and a public Instance Name:

```text
@{instance-name}.{owner-username}
```

The Worker manifest SHOULD provide a default instance-name segment. Notes defaults to `notes`; therefore Notes owned by `@rizalsambayu` is `@notes.rizalsambayu` and opens at `/@notes.rizalsambayu`.

The platform MUST enforce:

- at most one owned instance for each `(owner, Worker Definition)` pair;
- global uniqueness of the composed public Instance Name;
- uniqueness of the instance-name segment within an owner's namespace;
- membership access separately from ownership.

Accepting an invitation as Editor or Guest adds access to the owner's existing instance. It does not create another owned instance and does not change the handle suffix. Internal APIs, storage, events, permission checks, and relationships MUST use the instance UUID after resolving a public handle.

The display label and instance-name segment are separate. A label such as `Catatan Kerja` may change without changing the UUID. If the platform permits changing the instance-name segment, it MUST validate the new composed handle and update the canonical route atomically.

---

## 8. Data and Storage Models

A Worker chooses one of the following storage modes explicitly.

### 8.1 Orderly-Managed Worker Storage

Orderly provisions logical, instance-scoped storage and exposes it through `ctx.storage`. The Worker never receives raw database credentials or unrestricted SQL.

Use this mode when:

- data naturally belongs to a Worker Instance;
- the Worker should be easy to install;
- Orderly manages backup, isolation, quotas, and lifecycle;
- portability is more important than database-specific features.

Worker-managed logical models MUST remain separated from Orderly Core schemas. Physical implementation—generic records, namespaced schemas, or dedicated tables—is an Orderly concern and may evolve.

### 8.2 External or Worker-Managed Database

A Worker may use its own database through a controlled external integration. Credentials are stored as instance secrets, and connectivity passes through permission-controlled network capabilities.

Use this mode when:

- the Worker integrates an existing system of record;
- the publisher operates a remote service;
- specialized database behavior is required;
- data residency or enterprise ownership requires external storage.

Orderly must not expose internal network access merely because a Worker uses an external database. Host/domain allowlists, TLS, timeouts, response limits, secret isolation, SSRF protection, audit logs, and rate limits remain mandatory.

### 8.3 Core Data Through Capabilities

When a Worker needs Orderly data, it uses a narrow capability such as users, chat, contacts, files, or notifications. It does not query the Orderly database directly.

The distinction is always:

```text
Worker-owned data     → ctx.storage or approved external storage
Orderly-owned data    → capability API
Another Worker data   → explicit Worker action contract
```

---

## 9. UI Without Modifying Orderly Frontend

A Worker may define its own interface and behavior without adding components or routes directly to the Orderly Vue application.

Orderly should provide two UI modes:

### 9.1 Declarative Workspace

The Worker returns a validated UI schema rendered with Orderly components. This is the preferred starting point because it provides consistent accessibility, responsive behavior, theming, and stronger security.

Suitable for:

- forms;
- lists and tables;
- dashboards;
- detail views;
- simple editors;
- configuration screens.

### 9.2 Sandboxed Custom Workspace

Workers requiring fully custom interaction may ship a frontend bundle executed in an isolated origin or sandboxed frame. Communication with Orderly occurs through a versioned message bridge.

The sandbox MUST NOT receive raw authentication tokens, Core stores, unrestricted DOM access, platform secrets, or arbitrary internal API access. Content Security Policy, allowed origins, bridge method validation, payload limits, and permission checks must be enforced by Orderly.

The Orderly shell remains responsible for navigation, identity, theme context, responsive container, loading/error boundaries, and permission-aware capability access.

---

## 10. AI Integration

AI is an optional capability, not a requirement for every Worker.

A Worker may use:

1. **Orderly-managed AI** through `ctx.ai`, subject to supported models, user consent, quotas, billing, and platform safety controls.
2. **Publisher or user-provided AI API** through `ctx.http` and `ctx.secrets`, subject to declared hosts, network policy, and the external provider's terms.

AI permissions should be granular. A future initial contract may distinguish:

```text
ai:generate
ai:embed
ai:use-files
ai:use-chat-context
```

Workers must disclose what data is sent to an AI provider. Conversation history, files, profiles, contacts, and data belonging to other Workers are never implicit AI context. They require their own permissions and explicit runtime retrieval.

AI output is untrusted input. Workers must validate structured output, constrain tool calls, prevent prompt-driven permission escalation, and require confirmation for destructive or financially meaningful actions.

---

## 11. Worker-to-Worker Connections

Workers connect through explicit actions and events, never by reading each other's storage.

A Worker may publish a contract such as:

```text
Action: inventory.stock.check
Input:  { product_id, quantity }
Output: { available, remaining }
```

Another Worker may call it only when:

- the caller declares a Worker connection permission;
- the target exposes the action in its manifest;
- the user or instance administrator authorizes the connection;
- both instance identities are resolved;
- the runtime validates input and output schemas;
- timeouts, recursion depth, rate limits, and audit logs are enforced.

Recommended conceptual API:

```ts
await ctx.workers.call({
  instance: "@inventory.rizalsambayu",
  action: "inventory.stock.check",
  input: { product_id: "p_123", quantity: 2 }
});
```

Worker chains must propagate trace IDs but not automatically propagate every permission. Each call is authorized independently. Cycles and uncontrolled fan-out must be detected.

---

## 12. Realtime Collaboration Between Users

A Worker Instance may support multiple authorized users collaborating in realtime.

Orderly should provide a collaboration capability rather than allowing Workers to open arbitrary internal sockets. The capability may offer:

- instance membership and roles;
- presence and online state;
- scoped realtime channels;
- versioned domain events;
- optimistic updates;
- conflict detection;
- optional document synchronization primitives;
- audit history.

Potential roles are:

```text
owner
admin
editor
member
viewer
```

Every realtime connection and event must be authorized against the Worker Instance, user membership, role, permission grant, and event type. Channel names and instance identifiers alone are not authorization.

Workers should exchange domain events rather than arbitrary executable payloads:

```json
{
  "type": "task.updated",
  "version": 3,
  "resource_id": "task_123",
  "changes": {
    "status": "done"
  }
}
```

The first implementation should prioritize presence and server-authoritative events. Complex CRDT or collaborative document editing can be added only when a real Worker requires it.

---

## 13. Security Requirements

All third-party Worker code and packages are untrusted by default.

Mandatory platform controls include:

- deny-by-default permissions;
- per-instance authorization and data isolation;
- package path and archive validation;
- immutable, hashed releases;
- dependency and prohibited-file scanning;
- runtime time, memory, concurrency, request, and storage limits;
- no unrestricted host filesystem, process, environment, socket, or Core SQL access;
- backend-only secret access unless a separate safe design is approved;
- outbound network restrictions and SSRF protection;
- schema validation at every Worker/Core boundary;
- safe error responses and redacted logs;
- suspension, revocation, rollback, and audit mechanisms;
- explicit review of new or expanded permissions;
- separate test and production instances.

SDK checks improve developer experience but are not security controls. Authorization must be repeated inside the trusted runtime and capability service.

---

## 14. Contributor Workflow

The intended workflow is:

```bash
orderly worker create
orderly worker dev
orderly worker test
orderly worker validate
orderly worker build
orderly worker submit
```

Until these commands exist, documentation must clearly provide the equivalent repository commands.

A contribution should include:

- a valid manifest;
- a clear README and usage examples;
- declared permissions with justification;
- tests for business rules and capability failures;
- safe handling of missing permissions and secrets;
- data migration notes when models change;
- UI accessibility and responsive checks when applicable;
- changelog and semantic version;
- no Orderly Core imports or credentials;
- no undocumented network destinations.

Review should evaluate the Worker as a product and as untrusted software. Passing tests does not automatically qualify a Worker for public publication.

---

## 15. Compatibility and Documentation Discipline

The Worker SDK, manifest schema, runtime contract, UI bridge, and Orderly Core adapter each need explicit versions and a compatibility matrix.

Example:

```text
Worker manifest schema: 1
Worker SDK:              0.1.x
Runtime contract:        0.1
UI bridge:               0.1
Minimum Orderly Core:    0.x
```

Whenever implementation changes:

1. update tests and executable schemas;
2. update the relevant specification status;
3. record an architectural decision when the model changes;
4. update examples and templates;
5. document migrations and deprecations;
6. update the compatibility matrix.

Do not preserve a draft design merely because it was written first. Preserve its security and product intent, then update the contract to reflect the best verified implementation.

---

## 16. Incremental Delivery Plan

The complete vision should not be implemented in one step.

### Phase 0 — Contract Alignment

- organize documentation and status labels;
- define the repository layout;
- select the first real Worker use case;
- define the minimum manifest and permissions;
- document the current Orderly integration boundary.

### Phase 1 — First Local Worker

- Worker template;
- manifest schema and validator;
- minimal TypeScript SDK;
- local development/test runtime;
- chat handler;
- instance-scoped in-memory or test storage;
- conformance tests.

### Phase 2 — Orderly Integration

- Worker definitions and instances in Orderly;
- Worker Gateway;
- authenticated runtime dispatch;
- managed storage adapter;
- permission grants and enforcement;
- logs and controlled errors;
- private installation flow.

### Phase 3 — Worker Store

- release artifact and hash;
- publisher identity;
- review workflow;
- store listing and detail pages;
- installation consent;
- version pinning, update, suspension, and rollback.

### Phase 4 — Workspace UI

- declarative UI runtime first;
- versioned frontend bridge;
- sandboxed custom UI only after its security model is verified.

### Phase 5 — Extended Capabilities

- files, notifications, schedules, and controlled HTTP;
- external database integrations;
- Orderly-managed and custom-provider AI;
- Worker-to-Worker actions;
- multi-user realtime collaboration.

Each phase must produce a usable vertical slice and must not rely on future phases for its security boundary.

---

## 17. First Worker Selection

The first Worker should be deliberately small but exercise the essential architecture.

A suitable first Worker should demonstrate:

- one chat event;
- one reply;
- one instance-scoped data model;
- one-instance-per-owner-and-definition enforcement;
- create/list behavior;
- permission denial tests;
- a minimal Workspace or API view after the backend contract works;
- no external network or AI dependency in its first version.

A Notes or Tasks Worker is preferable to a payment, external AI, or multi-tenant enterprise Worker for the first vertical slice. AI, external databases, cross-Worker calls, and realtime collaboration should then be validated through dedicated Workers after the fundamental runtime is reliable.

---

## 18. Definition of Done for the Worker Platform Foundation

The initial foundation is ready when a contributor can:

1. create a Worker from a template;
2. run it locally without installing Orderly Core internals;
3. validate its manifest and permissions;
4. test chat behavior and instance-scoped storage;
5. package an immutable release;
6. install a private test instance in Orderly;
7. interact through Chat and a supported Workspace surface;
8. observe logs and safe errors;
9. prove that denied permissions and cross-instance access fail;
10. update documentation from the same contracts used by validation and tests.

Only after this path works end to end should Worker Store publication and advanced capabilities become the primary focus.

---

## 19. Guiding Principle

The Worker platform should make extension easy without making Orderly porous.

```text
Freedom inside the Worker boundary
        +
Explicit contracts at every boundary
        +
Orderly-enforced identity, permissions, isolation, and lifecycle
        =
A safe and extensible Worker ecosystem
```

Developers are free to design Worker behavior, domain logic, UI, storage strategy, and integrations. Orderly remains responsible for deciding how that Worker is authenticated, authorized, isolated, executed, connected, observed, distributed, and stopped.
