# Orderly Worker Runtime Specification

**Status:** Draft  
**Runtime Version:** 0.1  
**Project:** Orderly Worker

---

## 1. Purpose

The Orderly Worker Runtime defines how Worker Packages are executed inside the Orderly platform.

The Runtime is responsible for:

- loading Worker code
- isolating Worker execution
- resolving Worker Instances
- providing approved capabilities
- enforcing permissions
- handling Worker events
- dispatching Worker API routes
- managing Worker storage access
- rendering Worker frontend interfaces
- enforcing resource limits
- handling failures
- supporting versioned Worker releases

The primary runtime principle is:

> Worker code must never execute with unrestricted access to Orderly Core.

---

# 2. Runtime Responsibilities

The Worker Runtime SHOULD provide the following components:

```text
Worker Runtime
│
├── Package Loader
├── Instance Resolver
├── Event Dispatcher
├── API Dispatcher
├── Capability Provider
├── Permission Enforcer
├── Storage Adapter
├── Secret Provider
├── Frontend Runtime
├── Resource Controller
├── Logging
└── Error Handler
```

---

# 3. Runtime Architecture

Conceptually:

```text
                    Orderly Client
                         │
              ┌──────────┴──────────┐
              │                     │
             Chat               Workspace
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                   Worker Gateway
                         │
                         ▼
                  Instance Resolver
                         │
                         ▼
                   Worker Runtime
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
      Backend         Storage         Frontend
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                  Capability API
                         │
                         ▼
                    Orderly Core
```

---

# 4. Execution Model

Workers SHOULD be executed on demand.

A Worker SHOULD NOT need to run continuously unless the platform explicitly supports persistent runtime modes.

Typical flow:

```text
Event
  │
  ▼
Resolve Worker Instance
  │
  ▼
Load Worker Version
  │
  ▼
Create Execution Context
  │
  ▼
Execute Handler
  │
  ▼
Return Result
  │
  ▼
Dispose Execution Context
```

This model improves isolation and resource efficiency.

---

# 5. Worker Instance Resolution

Every Worker request MUST resolve to a specific Worker Instance.

Example:

```text
@harian.a45fc
```

The platform resolves:

```text
Worker Instance
├── Instance ID
├── Worker Definition
├── Worker Version
├── Owner
├── Permissions
├── Configuration
└── Runtime State
```

A request MUST NOT execute without a valid Worker Instance unless it is explicitly a Worker-level operation such as validation or publication testing.

---

# 6. Worker Version Resolution

Every Worker Instance SHOULD reference a specific Worker release.

Example:

```text
Instance:
@harian.a45fc

Worker:
notes

Version:
1.2.0
```

At runtime:

```text
Request
  │
  ▼
Instance
  │
  ▼
Worker Version 1.2.0
  │
  ▼
Package Artifact
  │
  ▼
Runtime
```

The Runtime MUST NOT silently load an unrelated Worker version.

---

# 7. Worker Package Loading

The Runtime SHOULD execute only packages that have already passed package validation.

A package MUST be considered invalid if:

```text
manifest missing
entrypoint missing
package hash mismatch
unsupported runtime
corrupt archive
unsafe paths
unsupported specification version
```

Published package artifacts SHOULD be immutable.

---

# 8. Runtime Types

Orderly MAY support multiple runtime types.

Initial implementations SHOULD keep the number of runtimes small.

Recommended initial backend runtime:

```text
TypeScript / JavaScript
Bun
```

Future runtimes MAY include:

```text
WebAssembly
Remote Worker
additional language runtimes
```

Support for a runtime MUST NOT automatically imply unrestricted host access.

---

# 9. Local Hosted Runtime

A hosted Worker runs inside infrastructure controlled by Orderly.

Conceptually:

```text
Orderly Infrastructure
│
├── Worker Runtime
│    │
│    ├── Worker A
│    ├── Worker B
│    └── Worker C
│
└── Orderly Core
```

Workers MUST be isolated from Orderly Core processes and data.

---

# 10. Remote Worker Runtime

Future versions MAY support Remote Workers.

A Remote Worker executes on infrastructure operated by the Worker publisher.

Conceptually:

```text
Orderly
   │
   │ HTTPS
   ▼
Publisher Worker Endpoint
```

The same Worker event and capability contracts SHOULD be reused where practical.

Remote Workers MUST authenticate requests.

Requests SHOULD be signed.

The platform SHOULD support replay protection.

---

# 11. Execution Context

Every Worker handler SHOULD receive an execution context.

Conceptually:

```ts
ctx
```

The context SHOULD expose only permitted resources.

Example:

```ts
ctx.instance
ctx.message
ctx.storage
ctx.chat
ctx.users
ctx.files
ctx.secrets
ctx.http
ctx.log
```

Unavailable capabilities MUST NOT be exposed or MUST fail safely.

---

# 12. Example Context

Conceptual example:

```ts
export async function onMessage(ctx) {
  const instance = ctx.instance;
  const message = ctx.message;

  await ctx.storage.insert("notes", {
    content: message.text
  });

  await ctx.chat.reply("Note saved.");
}
```

Worker code SHOULD NOT receive:

```text
database connection string
Orderly Core database client
host filesystem root
host process environment
unrestricted network socket
Orderly internal service credentials
```

---

# 13. Instance Context

The Runtime SHOULD provide basic instance metadata.

Example:

```ts
ctx.instance.id
ctx.instance.workerId
ctx.instance.name
ctx.instance.workerSlug
ctx.instance.workerVersion
```

Sensitive owner or member information SHOULD require explicit capabilities.

---

# 14. Capability Injection

Capabilities SHOULD be injected into the execution context based on granted permissions.

Example manifest:

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

Runtime:

```text
ctx.chat
  ✓ read
  ✓ write

ctx.storage
  ✓ read
  ✓ write

ctx.location
  ✗ unavailable
```

Workers MUST NOT be able to instantiate privileged capability clients themselves.

---

# 15. Permission Enforcement

Permission checks SHOULD happen in more than one layer.

Recommended:

```text
Manifest declaration
      │
      ▼
Instance grant
      │
      ▼
Runtime capability injection
      │
      ▼
Capability-level authorization
```

A Worker declaring a permission does not mean the permission is granted.

---

# 16. Storage Runtime

Worker storage MUST be scoped to the active Worker Instance.

Conceptual API:

```ts
ctx.storage.find("notes")
ctx.storage.get("notes", id)
ctx.storage.insert("notes", data)
ctx.storage.update("notes", id, data)
ctx.storage.delete("notes", id)
```

The Worker SHOULD operate against logical model names.

The Runtime determines the physical storage implementation.

---

# 17. Storage Isolation

The following MUST be prevented:

```text
Instance A
   │
   ▼
Instance B private storage
```

Default behavior:

```text
Instance A
   │
   ▼
Instance A storage only
```

Cross-instance access MUST require an explicit future capability or sharing model.

---

# 18. Data Model Provisioning

When a Worker version declares new models, Orderly SHOULD provision the corresponding logical storage structures.

Example manifest:

```text
notes
folders
tags
```

The Runtime MAY map them internally to:

```text
physical SQL tables
shared generic tables
JSON storage
isolated database schema
other persistence layers
```

Worker code SHOULD NOT depend on the physical representation.

---

# 19. Schema Changes

Worker updates MAY introduce data model changes.

Example:

```text
1.0.0

notes
├── id
└── content
```

Then:

```text
1.1.0

notes
├── id
├── title
└── content
```

The Runtime SHOULD eventually support controlled Worker data migrations.

A Worker MUST NOT run arbitrary migrations against Orderly Core.

---

# 20. Worker API Runtime

Worker routes declared in the manifest SHOULD be resolved through the Worker Gateway.

Example:

```text
GET /api/workers/@harian.a45fc/notes
```

Flow:

```text
Request
  │
  ▼
Authentication
  │
  ▼
Worker Gateway
  │
  ▼
Resolve Instance
  │
  ▼
Resolve Route
  │
  ▼
Permission Check
  │
  ▼
Worker Handler
  │
  ▼
Response
```

---

# 21. Route Handler Context

A route handler MAY receive:

```ts
ctx.request
ctx.params
ctx.query
ctx.body
ctx.instance
ctx.storage
```

Example:

```ts
export async function createNote(ctx) {
  const note = await ctx.storage.insert("notes", {
    content: ctx.body.content
  });

  return {
    status: 201,
    body: note
  };
}
```

---

# 22. API Isolation

Worker API handlers MUST NOT:

```text
register arbitrary Orderly Core routes
override existing Core routes
access unrelated Worker routes
bypass platform authentication
```

The Worker Gateway remains the public routing authority.

---

# 23. Event Runtime

Worker events SHOULD be delivered through the Event Dispatcher.

Example event:

```json
{
  "type": "chat.message",
  "instance_id": "...",
  "conversation_id": "...",
  "message": {
    "type": "text",
    "text": "Catat beli domain"
  }
}
```

The Runtime resolves the corresponding Worker handler.

---

# 24. Event Handler Mapping

Possible conceptual Worker module:

```ts
export default defineWorker({
  events: {
    "chat.message": onMessage,
    "instance.created": onInstanceCreated
  }
});
```

or equivalent handler mapping defined by the SDK.

The exact SDK syntax is not normative to this Runtime specification.

---

# 25. Event Delivery Guarantees

The platform SHOULD document event delivery semantics.

Potential models include:

```text
at-most-once
at-least-once
best-effort
```

Until stronger guarantees exist, Worker developers SHOULD assume event handlers may need to be idempotent.

---

# 26. Event IDs

Every event SHOULD include a unique event identifier.

Example:

```text
evt_...
```

Workers MAY use the event ID to detect duplicate processing.

---

# 27. Chat Runtime

Chat events SHOULD include only the data necessary for the Worker to process the event.

A Worker MUST NOT automatically receive unrelated conversation history.

Access to history SHOULD require an explicit permission.

Example:

```text
chat:read-current
chat:read-history
```

Future permission names are defined elsewhere.

---

# 28. Worker Responses

A Worker event handler MAY produce actions.

Conceptual response:

```json
{
  "actions": [
    {
      "type": "chat.reply",
      "text": "Note saved."
    }
  ]
}
```

The Runtime validates actions before execution.

A Worker MUST NOT directly mutate Orderly client state.

---

# 29. Frontend Runtime

Worker frontend code MUST execute separately from the Orderly Core frontend environment.

Recommended conceptual model:

```text
Orderly Shell
    │
    ▼
Worker Workspace Container
    │
    ▼
Worker UI Runtime
```

The Worker UI runtime SHOULD expose an SDK bridge.

---

# 30. Frontend Context

A Workspace MAY receive:

```ts
orderly.instance
orderly.api
orderly.ui
orderly.storage
orderly.events
```

The frontend SHOULD communicate with the Worker backend through approved APIs.

---

# 31. Frontend Security

Worker frontend code MUST NOT receive unrestricted access to:

```text
Orderly authentication tokens
Core application internals
other Worker DOM/state
browser credentials
Core frontend stores
internal APIs without permission
```

Custom Worker frontends SHOULD run in a strong isolation boundary.

---

# 32. UI Schema Runtime

Orderly MAY support declarative UI.

Example:

```json
{
  "type": "page",
  "children": [
    {
      "type": "heading",
      "text": "Notes"
    },
    {
      "type": "button",
      "text": "New Note",
      "action": "create-note"
    }
  ]
}
```

The Runtime validates the schema and renders supported components.

Declarative UI SHOULD be preferred for simple Workers because it is easier to secure and maintain.

---

# 33. Sandbox UI Runtime

Complex Workers MAY use sandboxed frontend applications.

Potential implementation boundaries include:

```text
iframe sandbox
isolated webview
separate origin
restricted module runtime
```

The exact technology is implementation-defined.

The security boundary MUST remain explicit.

---

# 34. Secrets Runtime

Worker secrets MUST be stored separately from Worker packages.

Example:

```text
OPENAI_API_KEY
PAYMENT_API_SECRET
EXTERNAL_SERVICE_TOKEN
```

Worker code SHOULD access them through:

```ts
ctx.secrets.get("openai_api_key")
```

Secrets SHOULD NOT be exposed to the Worker frontend unless explicitly intended and safe.

---

# 35. Environment Variables

Workers MUST NOT receive unrestricted host environment variables.

Bad:

```ts
process.env
```

with all host secrets visible.

If environment-style configuration is supported, only Worker-scoped values SHOULD be injected.

---

# 36. Network Access

Outgoing network access MUST be controlled.

A Worker requiring HTTP access SHOULD have:

```text
http:request
```

or equivalent permission.

The Runtime MAY restrict:

```text
allowed domains
protocols
methods
ports
timeout
request size
response size
redirect count
```

---

# 37. Filesystem Access

Workers SHOULD NOT receive unrestricted filesystem access.

If Worker file storage is needed, use:

```ts
ctx.files
```

or:

```ts
ctx.storage
```

The host filesystem SHOULD remain inaccessible.

---

# 38. Resource Limits

Every Worker execution SHOULD have platform-defined limits.

Possible limits:

```text
CPU time
wall-clock timeout
memory
request body size
response size
network bandwidth
storage
number of outbound requests
```

Example:

```text
timeout: 5 seconds
memory: 128 MB
```

Exact defaults are implementation-defined.

---

# 39. Timeout Handling

If a Worker exceeds its execution timeout:

```text
Runtime
  │
  ▼
Terminate execution
  │
  ▼
Record error
  │
  ▼
Return controlled failure
```

A timed-out Worker MUST NOT continue executing uncontrolled background work.

---

# 40. Memory Limits

The Runtime SHOULD terminate Worker execution exceeding allowed memory.

One Worker MUST NOT be able to exhaust resources required by unrelated Workers or Orderly Core.

---

# 41. Concurrency

Multiple instances MAY execute simultaneously.

Example:

```text
@harian.a45fc
@sekolah.b82kd
@kasir.72kmp
```

The Runtime MUST ensure concurrent execution does not mix instance state.

---

# 42. Stateful Workers

The default Worker execution model SHOULD be stateless between invocations.

Persistent state belongs in:

```text
Worker Storage
Secrets
Configuration
Platform state
```

Developers MUST NOT rely on in-memory process state surviving between requests.

---

# 43. Background Work

Workers MUST NOT spawn unrestricted background processes.

Long-running work SHOULD use a platform-managed job system.

Conceptually:

```ts
ctx.jobs.enqueue(...)
```

Future versions MAY define this capability.

---

# 44. Scheduled Tasks

Scheduled Worker handlers MUST execute through the same runtime and permission system as ordinary handlers.

Flow:

```text
Scheduler
   │
   ▼
Resolve Instance
   │
   ▼
Resolve Worker Version
   │
   ▼
Runtime
   │
   ▼
Scheduled Handler
```

A scheduled job MUST remain scoped to its Worker Instance.

---

# 45. Logging

The Runtime SHOULD provide Worker-scoped logging.

Example:

```ts
ctx.log.info("Note created")
ctx.log.warn("External API slow")
ctx.log.error("Failed to process payment")
```

Logs SHOULD include:

```text
timestamp
Worker
Worker version
instance
execution ID
severity
message
```

Sensitive data SHOULD be redacted where possible.

---

# 46. Execution ID

Every Worker invocation SHOULD receive a unique execution ID.

Example:

```text
exec_...
```

This enables:

```text
debugging
tracing
support
audit
performance analysis
```

---

# 47. Error Handling

Worker failures MUST be contained.

Example:

```text
Worker throws error
       │
       ▼
Runtime catches error
       │
       ├── record logs
       ├── record execution status
       └── return safe error
```

A Worker crash MUST NOT crash Orderly Core.

---

# 48. Error Response

Workers SHOULD NOT expose raw internal stack traces to end users by default.

Developer environments MAY expose detailed errors.

Production environments SHOULD return controlled messages.

---

# 49. Runtime Health

The platform SHOULD track Worker runtime health.

Possible metrics:

```text
executions
success rate
error rate
timeouts
memory failures
average duration
API failures
```

These MAY later appear in the Developer Dashboard.

---

# 50. Worker Suspension

Orderly MUST be able to prevent execution of a Worker Definition or Worker Instance.

Examples:

```text
security issue
malware
policy violation
billing failure
publisher suspension
runtime incompatibility
```

A suspended Worker MUST NOT execute normal handlers.

---

# 51. Version Rollback

Because Worker releases SHOULD be immutable, the platform MAY allow instances to roll back.

Example:

```text
2.1.0
  ↓ problem

rollback

2.0.3
```

Data compatibility must be considered before rollback.

---

# 52. Runtime Compatibility

Each Worker release SHOULD declare the platform/runtime contract it requires.

Future example:

```json
{
  "runtime": {
    "type": "bun",
    "version": "2"
  }
}
```

A Worker requiring an unsupported runtime MUST NOT execute.

---

# 53. Runtime Upgrade

Orderly MAY update runtime implementations without changing the Worker Specification, provided public contracts remain compatible.

For example:

```text
Worker SDK behavior remains stable
Worker Runtime internals change
```

This separation is intentional.

---

# 54. Developer Mode

The platform SHOULD provide a local or development runtime.

Conceptual flow:

```text
Developer
   │
   ▼
orderly worker dev
   │
   ▼
Local Worker Runtime
   │
   ├── simulated instance
   ├── local storage
   ├── event testing
   └── Workspace preview
```

Developer Mode SHOULD approximate production contracts closely.

---

# 55. Test Instance

Before publication, Orderly SHOULD allow a test Worker Instance.

Example:

```text
Notes Worker 1.0.0
      │
      ▼
Test Instance
@test-notes.xxxxx
```

The test instance SHOULD remain isolated from production user instances.

---

# 56. Publication Validation

Before a Worker version becomes executable in production, the platform SHOULD validate:

```text
package
manifest
entrypoint
runtime compatibility
permissions
routes
data models
frontend
security
basic execution
```

A successful build alone MUST NOT imply publication approval.

---

# 57. Worker-to-Core Communication

Workers interact with Orderly Core only through documented capabilities.

Correct:

```text
Worker
  │
  ▼
Capability API
  │
  ▼
Orderly Core
```

Incorrect:

```text
Worker
  │
  ▼
Internal Orderly module
```

or:

```text
Worker
  │
  ▼
Core database
```

---

# 58. Core-to-Worker Communication

Orderly communicates with Workers through documented runtime contracts.

Examples:

```text
events
API dispatch
lifecycle hooks
scheduled execution
Workspace initialization
```

This communication SHOULD remain versioned.

---

# 59. Worker Runtime Boundary

The Runtime boundary is the most important security boundary in the Worker Platform.

Conceptually:

```text
UNTRUSTED
────────────────────────────
Worker code
Worker frontend
Worker dependencies
Worker data input

          Runtime Boundary

TRUSTED
────────────────────────────
Permission Engine
Capability API
Worker Gateway
Orderly Core
Core Database
Platform Secrets
```

Everything originating from Worker packages MUST be treated as untrusted.

---

# 60. Recommended V1 Runtime

To reduce implementation complexity, the first production runtime SHOULD be intentionally limited.

Recommended V1:

```text
Backend
→ TypeScript / JavaScript
→ Bun-compatible bundle

Execution
→ on-demand
→ stateless
→ timeout limited
→ memory limited

Storage
→ platform-managed Worker Storage

API
→ Worker Gateway namespaced routes

Frontend
→ UI Schema first
→ sandbox frontend optional

Network
→ denied by default
→ permission-controlled HTTP

Secrets
→ platform-managed

Core access
→ capability API only
```

---

# 61. V1 Non-Goals

The first Runtime version SHOULD NOT attempt to support all possible execution environments.

V1 may intentionally exclude:

```text
arbitrary Docker containers
privileged Linux processes
SSH access
arbitrary system packages
custom databases
persistent daemons
unrestricted sockets
arbitrary language runtimes
direct Core SQL
```

These features can be evaluated later.

---

# 62. Future WebAssembly Runtime

Future Orderly versions MAY support WebAssembly-based Worker execution.

Conceptually:

```text
Worker source
    │
    ▼
Compile to Wasm
    │
    ▼
Orderly Wasm Runtime
    │
    ▼
Capability Interfaces
```

Potential benefits include:

```text
strong sandboxing
portable runtime
multi-language support
explicit capabilities
lower startup overhead
```

This is not required for Runtime v0.1.

---

# 63. Future Remote Runtime

Large integrations MAY run outside Orderly infrastructure.

Conceptually:

```text
Worker Event
    │
    ▼
Signed HTTPS Request
    │
    ▼
Remote Worker
    │
    ▼
Signed Response
```

This may be useful for:

```text
enterprise systems
proprietary applications
large AI workloads
existing SaaS integrations
ERP integrations
```

---

# 64. Runtime Security Principles

Implementations SHOULD follow these principles.

### Deny by Default

Capabilities not explicitly granted should be unavailable.

### Instance Isolation

One instance should not access another by default.

### Immutable Releases

Published Worker artifacts should not change.

### Controlled I/O

Storage, network, files, secrets, and platform APIs should pass through runtime-controlled interfaces.

### Limited Resources

Worker execution should have CPU, memory, and time boundaries.

### Failure Containment

Worker failures should not propagate into Orderly Core.

### Stable Contracts

Worker developers should depend on documented runtime APIs rather than internal Orderly architecture.

---

# 65. Example Runtime Flow

User sends:

```text
@harian.a45fc catat meeting jam 10
```

Runtime flow:

```text
Chat
  │
  ▼
Resolve @harian.a45fc
  │
  ▼
Instance
  │
  ├── Worker: notes
  └── Version: 1.0.0
  │
  ▼
Create chat.message event
  │
  ▼
Worker Runtime
  │
  ▼
Load notes@1.0.0
  │
  ▼
Inject permitted capabilities
  │
  ├── chat
  └── storage
  │
  ▼
Execute onMessage()
  │
  ▼
ctx.storage.insert(...)
  │
  ▼
Worker Storage
  │
  ▼
ctx.chat.reply(...)
  │
  ▼
Orderly Chat
```

The Worker never requires direct access to the Core database or Chat implementation.

---

# 66. Summary

The Worker Runtime transforms an uploaded Worker Package into controlled execution.

```text
Worker Package
      │
      ▼
Worker Definition
      │
      ▼
Worker Instance
      │
      ▼
Worker Runtime
      │
      ├── Event execution
      ├── API execution
      ├── Storage
      ├── Workspace
      ├── Secrets
      ├── Network
      └── Capabilities
      │
      ▼
Orderly Platform
```

The Runtime must allow Workers to be powerful enough to act as real applications while remaining isolated from Orderly Core and from unrelated Worker Instances.

---

**Orderly Worker Runtime Specification — Draft 0.1**