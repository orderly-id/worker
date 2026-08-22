# Orderly Worker Specification

**Status:** Draft  
**Specification Version:** 0.1  
**Project:** Orderly Worker

---

## 1. Introduction

Orderly Worker is an application model for extending the Orderly platform with independently developed functionality.

A Worker can introduce functionality that does not exist in Orderly Core, including:

- backend logic
- data models
- API endpoints
- chat behaviors
- Workspace interfaces
- scheduled tasks
- integrations
- configuration
- instance-specific storage

Workers can be developed by Orderly or third-party developers and distributed through the Worker Store.

The primary architectural principle is:

> Workers extend Orderly without modifying Orderly Core.

A Worker MUST interact with Orderly through the interfaces and capabilities defined by the Worker Platform.

---

# 2. Terminology

## 2.1 Worker

A **Worker** is an application definition that can be installed from the Worker Store and instantiated by users.

Examples:

```text
Notes Worker
Finance Worker
Booking Worker
Restaurant Worker
IoT Worker
```

A Worker itself does not represent a user's individual installation.

---

## 2.2 Worker Package

A **Worker Package** is the distributable artifact containing the files required to define and execute a Worker.

The initial package format is:

```text
.zip
```

Example:

```text
notes-worker.zip
```

A package SHOULD contain:

```text
notes-worker.zip
│
├── orderly.worker.json
│
├── backend/
├── frontend/
├── assets/
└── README.md
```

The exact internal implementation may vary depending on Worker capabilities and future specification versions.

---

## 2.3 Worker Definition

A **Worker Definition** is the registered representation of a Worker inside the Orderly platform.

It is created from a valid Worker Package.

Example:

```text
Notes Worker

Slug:
notes

Version:
1.0.0

Publisher:
Orderly
```

A Worker Definition can be used to create multiple Worker Instances across the platform, but each user MUST own at most one instance of that Worker Definition.

---

## 2.4 Worker Instance

A **Worker Instance** is an independent instance of a Worker created by a user or organization.

Example:

```text
Worker Definition

Notes Worker
      │
      ├── owner: @rizalsambayu
      │   @notes.rizalsambayu
      │
      ├── owner: @elsafira
      │   @notes.elsafira
      │
      └── owner: @budi
          @notes.budi
```

Every Worker Instance MUST have independent identity and state.

An instance MAY have its own:

- name
- Worker ID
- configuration
- data
- permissions
- members
- conversations
- Workspace state
- secrets
- scheduled tasks

Instances owned by different users from the same Worker Definition MUST NOT automatically share private instance data. A user MAY access another owner's instance through membership, but this access MUST NOT create a second owned instance or transfer ownership.

---

## 2.5 Worker Store

The **Worker Store** is the distribution system where users can discover and use published Workers.

Example:

```text
/workerstore

/workerstore/notes
/workerstore/finance
/workerstore/booking
```

The Worker Store contains Worker Definitions, not Worker Instances.

---

## 2.6 Worker List

The **Worker List** contains Worker Instances available to a user.

It behaves conceptually similarly to a contact list.

Example:

```text
Workers

Notes
Notes Worker
@notes.rizalsambayu

Toko
Finance Worker
@toko.rizalsambayu
```

---

## 2.7 Workspace

A **Workspace** is the rich graphical interface provided by a Worker Instance.

Chat is intended for conversational interaction.

Workspace is intended for interfaces requiring more complex interaction or visualization.

Examples include:

```text
Forms
Tables
Dashboards
Editors
Calendars
Maps
Charts
Device controls
Reports
```

---

## 2.8 Orderly Core

**Orderly Core** refers to platform functionality controlled by Orderly itself.

Examples may include:

```text
Identity
Users
Chat
Conversations
Worker Registry
Worker Store
Worker Instances
Permissions
Billing
Notifications
```

Workers MUST NOT directly modify Orderly Core.

---

# 3. Architectural Model

The Worker architecture consists of the following conceptual layers:

```text
┌─────────────────────────────────────────────┐
│                 Orderly Client              │
│                                             │
│           Chat            Workspace         │
└─────────────┬─────────────────┬─────────────┘
              │                 │
              └────────┬────────┘
                       │
                       ▼
                Worker Gateway
                       │
                       ▼
                Worker Runtime
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Instance A          Instance B
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
                Capability API
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
      Chat           Storage           UI
                       │
                       ▼
                  Orderly Core
```

Worker implementation MUST remain logically separated from Orderly Core implementation.

---

# 4. Worker Identity

A Worker and Worker Instance have different identities.

## 4.1 Worker Identity

A Worker Definition SHOULD have:

```text
name
slug
publisher
version
```

Example:

```text
Name:
Notes Worker

Slug:
notes

Publisher:
Orderly

Version:
1.0.0
```

The combination used as the permanent internal identifier is implementation-defined.

The human-readable Worker name MUST NOT be relied upon as the sole internal identifier.

---

## 4.2 Instance Identity

Every Worker Instance MUST receive a unique internal identifier.

It MUST additionally receive a human-readable public **Instance Name** derived from the instance-name segment and owner username.

Recommended format:

```text
@{instance-name}.{owner-username}
```

Example:

```text
@notes.rizalsambayu
```

Additional examples:

```text
@notes.elsafira
@kasir.rizalsambayu
@booking.rizalsambayu
```

The owner-username suffix MUST be the normalized username of the owning user. The instance-name segment SHOULD default from Worker manifest metadata and MUST use a route-safe normalized form. Notes defaults to `notes`.

The canonical public page MUST use the same handle:

```text
/@notes.rizalsambayu
```

Public Instance Names are lookup and routing identifiers. Internal authorization, storage scope, relations, and events MUST use the unique internal instance ID after resolution.

---

## 4.3 Instance Label and Instance Name

The optional instance label and public Instance Name MUST be treated as separate concepts.

Example:

```text
Instance Label:
Catatan Kerja

Worker:
Notes Worker

Instance Name:
@notes.rizalsambayu
```

Changing the instance label MUST NOT require changing the Instance Name.

Implementations SHOULD treat Instance Names as canonical public handles. If the owner username or instance-name segment changes, the platform MUST atomically update the canonical handle and SHOULD preserve an explicit redirect or tombstone policy; the internal UUID never changes.

An owner MUST NOT create a second instance from the same Worker Definition. The storage layer MUST enforce uniqueness for `(owner_user_id, worker_definition_id)`, and creation APIs MUST return a deterministic conflict response. A membership granted to another user is access to the existing instance, not ownership of another instance.

---

# 5. Instance Creation

Users create Worker Instances from Worker Definitions.

Standard flow:

```text
Worker Store
     │
     ▼
Notes Worker
     │
     ▼
Use
     │
     ▼
Create Instance
     │
     ▼
Instance Label
     │
     ▼
Create
     │
     ▼
Worker Instance
```

Example:

```text
Notes Worker

Instance Name Segment
[ notes ]

Instance Name
@notes.rizalsambayu

Public Page
/@notes.rizalsambayu

[ Create Instance ]
```

After creation, the instance SHOULD appear in the user's Worker List.

---

# 6. Worker Package

A Worker SHOULD be distributable as a single package.

Initial package format:

```text
worker-name.zip
```

Recommended structure:

```text
worker-name.zip
│
├── orderly.worker.json
│
├── backend/
│
├── frontend/
│
├── assets/
│
└── README.md
```

---

# 7. Manifest

Every Worker Package MUST contain:

```text
orderly.worker.json
```

The manifest is the machine-readable description of the Worker.

At minimum, it SHOULD identify:

```text
schema version
Worker name
Worker slug
Worker version
description
publisher/author information
runtime requirements
entrypoints
requested permissions
```

Example:

```json
{
  "schema_version": "1",
  "name": "Notes Worker",
  "slug": "notes",
  "version": "1.0.0",
  "description": "Create and manage notes through Orderly.",
  "backend": {
    "entry": "backend/index.ts"
  },
  "frontend": {
    "entry": "frontend/index.ts"
  },
  "permissions": [
    "chat:read",
    "chat:write",
    "storage:read",
    "storage:write"
  ]
}
```

The complete manifest format is defined separately by the Orderly Worker Manifest Specification.

---

# 8. Backend

Workers MAY provide backend logic.

Backend logic can implement functionality such as:

```text
business rules
data processing
chat handling
API handlers
scheduled tasks
external integrations
automation
```

Worker backend code MUST execute through an Orderly-approved Worker Runtime.

Worker backend code MUST NOT assume direct access to Orderly Core infrastructure.

---

# 9. Worker Storage

Workers MAY require persistent storage.

Workers SHOULD be able to define data structures that do not exist in Orderly Core.

For example:

```text
Notes Worker

notes
folders
tags
```

Another Worker could define completely different data:

```text
Restaurant Worker

menus
menu_items
tables
orders
order_items
```

Orderly Core MUST NOT need prior knowledge of these models.

---

## 9.1 Instance Isolation

Worker data MUST be scoped to an instance unless explicitly designed otherwise.

Conceptually:

```text
Worker Data
│
├── instance_a45fc
│   ├── notes
│   └── folders
│
└── instance_b82kd
    ├── notes
    └── folders
```

Instance A MUST NOT automatically have access to Instance B's data.

---

## 9.2 Core Database Access

Workers MUST NOT receive unrestricted access to the Orderly Core database.

The following behavior MUST NOT be permitted:

```text
Worker
   │
   ▼
Direct unrestricted SQL
   │
   ▼
Orderly Core Database
```

Instead:

```text
Worker
   │
   ▼
Worker Storage API
```

or:

```text
Worker
   │
   ▼
Capability API
   │
   ▼
Orderly Core
```

---

# 10. Worker API

Workers MAY define API handlers that were not previously known to Orderly Core.

For example:

```text
GET    /notes
POST   /notes
GET    /notes/:id
PATCH  /notes/:id
DELETE /notes/:id
```

These routes MUST be scoped through the Worker Platform.

A Worker MUST NOT directly register arbitrary routes into Orderly Core.

Conceptually:

```text
/api/workers/:instance/*
```

Example:

```text
/api/workers/@notes.rizalsambayu/notes
```

Request flow:

```text
HTTP Request
     │
     ▼
Worker Gateway
     │
     ▼
Resolve Instance
     │
     ▼
Resolve Worker
     │
     ▼
Resolve Handler
     │
     ▼
Worker Runtime
```

This allows new Worker APIs without requiring new Orderly Core routes for every Worker.

---

# 11. Chat

Workers MAY interact through Orderly Chat.

A Worker Instance SHOULD be addressable similarly to other entities within the conversation system.

Example:

```text
@notes.rizalsambayu
```

A Worker MAY receive permitted events such as:

```text
chat.message
chat.command
conversation.created
```

Exact event names are defined by the Worker API specification.

---

## 11.1 Example

```text
User:

Catat ide membuat Worker Store.


Worker:

Catatan disimpan.
```

Conceptually:

```text
Message
   │
   ▼
Orderly Chat
   │
   ▼
Worker Gateway
   │
   ▼
Worker Instance
   │
   ▼
Worker Logic
   │
   ▼
Response
```

---

# 12. Workspace

A Worker MAY provide a Workspace.

Workspace allows Workers to provide functionality that is not practical through text conversation alone.

Examples:

```text
Notes Worker
→ editor

Finance Worker
→ reports and transactions

Booking Worker
→ calendar

Restaurant Worker
→ menu and table map

IoT Worker
→ device dashboard
```

A Workspace MAY contain UI that did not previously exist in Orderly.

However, Worker UI MUST execute within boundaries defined by the Worker Platform.

Worker UI MUST NOT modify the Orderly Core frontend.

---

# 13. Frontend Isolation

A Worker MUST NOT require its source code to be merged into the Orderly frontend.

The following model MUST NOT be required:

```text
Worker Upload
     ↓
Copy files into Orderly Vue project
     ↓
Modify Vue Router
     ↓
Rebuild Orderly
```

Instead:

```text
Worker Package
     ↓
Worker UI Runtime
     ↓
Workspace
```

Orderly MAY support multiple UI execution models.

Examples may include:

```text
Orderly UI components
declarative UI schemas
sandboxed frontend applications
```

The exact frontend runtime is implementation-defined by the corresponding specification version.

---

# 14. Capabilities

Workers interact with Orderly through capabilities.

Potential capability namespaces include:

```text
chat
storage
users
workspace
files
notifications
schedule
http
location
```

Example conceptual API:

```text
orderly.chat.send()
orderly.storage.get()
orderly.storage.set()
orderly.users.get()
orderly.notifications.send()
```

The availability of a capability MUST NOT imply that every Worker can use it.

Capabilities MUST be controlled through permissions.

---

# 15. Permissions

Workers MUST declare the permissions they require.

Example:

```json
{
  "permissions": [
    "chat:read",
    "chat:write",
    "storage:read",
    "storage:write"
  ]
}
```

Orderly MUST determine whether requested permissions can be granted.

A Worker MUST NOT be able to bypass the permission system.

Sensitive capabilities MAY require additional user consent, platform review, or publisher verification.

---

# 16. Security Boundary

Third-party Workers MUST be considered untrusted by default.

Worker execution SHOULD follow the principle of least privilege.

A Worker MAY:

```text
✓ Execute its permitted business logic
✓ Access its own instance data
✓ Use granted capabilities
✓ Handle its own API requests
✓ Render its Workspace
✓ Receive permitted events
```

A Worker MUST NOT:

```text
✗ Modify Orderly Core code
✗ Modify Orderly Core database schemas
✗ Read arbitrary Core database records
✗ Access another instance without permission
✗ Access another Worker's private storage
✗ Register unrestricted Core routes
✗ Bypass authentication
✗ Bypass permissions
✗ Execute unrestricted host operations
```

---

# 17. Worker Lifecycle

A Worker Definition SHOULD support lifecycle states.

Possible states include:

```text
draft
testing
review
published
suspended
deprecated
```

Example lifecycle:

```text
Create
  ↓
Draft
  ↓
Test
  ↓
Submit
  ↓
Review
  ↓
Publish
  ↓
Worker Store
```

The exact moderation process is controlled by the Worker Store.

---

# 18. Instance Lifecycle

Worker Instances SHOULD have an independent lifecycle from their Worker Definition.

Possible states:

```text
creating
active
disabled
suspended
deleted
```

Deleting or disabling one owner's instance MUST NOT affect instances of the same Worker owned by other users. Re-creation policy after deletion is platform-defined, but the one-active-owned-instance constraint MUST remain enforceable.

---

# 19. Versioning

Worker package versions and Worker Platform specification versions are separate.

Example:

```text
Worker Version:
Notes Worker 2.4.1

Worker Specification:
0.1
```

Future versions might use:

```text
Notes Worker 3.0.0
Worker API v2
```

Worker implementations SHOULD use semantic versioning for Worker releases.

---

# 20. Worker Updates

Publishing a new Worker version MUST NOT implicitly mean that every existing instance immediately executes the new version.

The platform SHOULD retain enough information to determine which Worker version an instance uses.

Conceptually:

```text
Notes Worker

1.0.0
1.1.0
2.0.0

Instances:

@notes.rizalsambayu
→ 2.0.0

@notes.elsafira
→ 1.1.0
```

The platform MAY support:

```text
automatic updates
manual updates
staged rollout
version pinning
rollback
```

---

# 21. Publisher

Every published Worker MUST have a publisher.

A publisher MAY represent:

```text
individual developer
organization
Orderly
```

Publisher identity is separate from Worker identity.

A publisher MAY own multiple Workers.

Example:

```text
Orderly
│
├── Notes Worker
├── Finance Worker
└── Booking Worker
```

---

# 22. Worker Store Publication

A package uploaded to the Worker Store SHOULD pass validation before publication.

Conceptual flow:

```text
Upload Package
      │
      ▼
Package Validation
      │
      ▼
Manifest Validation
      │
      ▼
Dependency Validation
      │
      ▼
Security Validation
      │
      ▼
Runtime Validation
      │
      ▼
Test Instance
      │
      ▼
Review
      │
      ▼
Publish
```

Successful upload MUST NOT automatically imply public publication.

---

# 23. Worker Package Validation

The platform SHOULD reject packages that violate the active Worker specification.

Examples include:

```text
missing manifest
invalid manifest
unsupported specification version
invalid entrypoint
unsupported runtime
invalid permissions
package corruption
prohibited files
security policy violations
```

Validation rules MAY become stricter over time.

---

# 24. Runtime Independence

Worker specifications SHOULD avoid unnecessary dependence on the internal implementation of Orderly.

For example, a Worker SHOULD NOT need to know that Orderly Core internally uses a particular:

```text
web framework
database
message broker
frontend framework
deployment system
```

A Worker should depend on:

```text
Worker API
Worker SDK
Capability API
Worker Runtime contract
```

This allows Orderly Core infrastructure to evolve without unnecessarily breaking Workers.

---

# 25. Official and Third-Party Workers

Official system-managed Workers MAY diprovisikan otomatis untuk setiap user. Instance tersebut tetap MUST memiliki ID internal unik, version, storage scope, permission grant, dan audit trail. Orderly Assistant adalah Worker utama bawaan dan mengikuti handle `@assistant.{owner-username}`; misalnya milik `@rizalsambayu` adalah `@assistant.rizalsambayu`. Reserved default instance-name `assistant` MUST NOT digunakan sebagai pengganti ID internal atau diberikan kepada Worker pihak ketiga. Lihat `Orderly Assistant Design Guide.md`.

Official Orderly Workers SHOULD use the same public Worker architecture whenever practical.

Conceptually:

```text
                    Worker Platform
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
       Orderly         Community       Companies
       Workers          Workers         Workers
```

Official Workers SHOULD NOT depend on undocumented privileged interfaces when equivalent public Worker capabilities exist.

This helps ensure that the public Worker Platform remains capable enough to build production applications.

---

# 26. Portability

A Worker Package SHOULD contain enough metadata to determine:

```text
what the Worker is
which specification it targets
what runtime it requires
where its entrypoints are
which capabilities it requires
which version it represents
```

The package SHOULD NOT depend on manually modifying an Orderly deployment.

---

# 27. Developer Experience

The Worker Platform SHOULD make the common development workflow straightforward.

Target workflow:

```text
Create
   ↓
Develop
   ↓
Run locally
   ↓
Test
   ↓
Validate
   ↓
Package
   ↓
Upload
   ↓
Publish
```

Future tooling MAY expose commands such as:

```bash
orderly worker create
orderly worker dev
orderly worker test
orderly worker validate
orderly worker build
orderly worker publish
```

These commands are illustrative and are not currently normative requirements of this specification.

---

# 28. Example Worker

A minimal conceptual Notes Worker:

```text
notes-worker/
│
├── orderly.worker.json
│
├── backend/
│   └── index.ts
│
├── frontend/
│   └── index.ts
│
└── README.md
```

Manifest:

```json
{
  "schema_version": "1",
  "name": "Notes Worker",
  "slug": "notes",
  "version": "1.0.0",
  "description": "Create and manage notes.",
  "backend": {
    "entry": "backend/index.ts"
  },
  "frontend": {
    "entry": "frontend/index.ts"
  },
  "permissions": [
    "chat:read",
    "chat:write",
    "storage:read",
    "storage:write"
  ]
}
```

A user discovers it:

```text
Worker Store
     ↓
Notes Worker
     ↓
Use
```

The user creates:

```text
Instance Name:
notes
```

Orderly creates:

```text
Notes
Notes Worker
@notes.rizalsambayu
/@notes.rizalsambayu
```

The resulting instance has independent:

```text
identity
data
configuration
permissions
conversation
Workspace
```

---

# 29. Non-Goals

The Worker Specification does not require Workers to:

- understand Orderly Core source code
- share Orderly Core database schemas
- use the same backend framework as Orderly
- use the same frontend framework as Orderly
- modify Orderly Core routes
- be manually deployed with Orderly Core
- have functionality predefined by Orderly

The Worker system is specifically intended to allow functionality that Orderly Core did not anticipate when it was built.

---

# 30. Design Principles

Implementations of the Orderly Worker Platform SHOULD follow these principles.

### Isolation

A Worker failure or compromise should have limited impact outside the affected Worker environment.

### Extensibility

Workers should be capable of introducing new functionality without requiring changes to Orderly Core.

### Stable Contracts

Workers should depend on documented platform contracts instead of internal implementation details.

### Instance Independence

Each Worker Instance should behave as an independent application instance.

### Least Privilege

Workers should receive only the capabilities necessary for their declared functionality.

### Conversation First

Chat should remain a first-class way of interacting with Workers.

### Rich Interfaces When Needed

Workers should be able to provide Workspace interfaces when conversation alone is insufficient.

### Developer Accessibility

Building a basic Worker should not require understanding Orderly's internal architecture.

---

# 31. Specification Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** in this document indicate requirement levels.

- **MUST / MUST NOT** — required for specification compliance.
- **SHOULD / SHOULD NOT** — recommended unless there is a valid reason to do otherwise.
- **MAY** — optional behavior.

---

# 32. Specification Evolution

This specification is currently a draft.

Before a stable `1.0` specification, breaking changes MAY occur.

Future specifications are expected to define more detailed contracts for:

```text
Worker Manifest
Worker Runtime
Worker SDK
Worker API
Worker Events
Worker Storage
Worker UI
Worker Permissions
Worker Packaging
Worker Store
Worker Security
```

Where possible, these concerns SHOULD remain separate specifications so that individual components can evolve without unnecessarily changing the entire Worker model.

---

# 33. Summary

The fundamental Orderly Worker model is:

```text
Developer
    │
    ▼
Worker Package
    │
    ▼
Worker Definition
    │
    ▼
Worker Store
    │
    ▼
User
    │
    ▼
Create Instance
    │
    ▼
Worker Instance
    │
    ├── Identity
    ├── Chat
    ├── Data
    ├── Backend
    ├── API
    ├── Workspace
    ├── Configuration
    └── Permissions
```

Workers extend Orderly through defined platform contracts rather than modifications to Orderly Core.

This allows Orderly to support applications, interfaces, data models, and workflows that were not known or implemented when the platform itself was created.

# 31. Domain-neutral agent contract

Orderly Core MUST remain domain-neutral. Notes, invoice, menu, parking, coworking, IoT, and future Workers share package, action, storage, knowledge, permission, event, connection, confirmation, and audit primitives while retaining package-owned domain logic.

Publisher system prompts and schemas are versioned Worker Definition resources. Owner instructions and uploaded knowledge belong to a lower-priority instance layer. Connections expose explicitly granted typed capabilities rather than raw database access or unrestricted delegation. The complete normative contract is `Orderly Worker AI, Knowledge, and Connection Specification.md`.

---

**Orderly Worker — Draft Specification 0.1**
