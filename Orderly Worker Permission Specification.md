# Orderly Worker Permission Specification

**Status:** Draft  
**Permission Version:** 0.1  
**Project:** Orderly Worker

---

## 1. Purpose

The Orderly Worker Permission system defines which platform capabilities a Worker may request and use.

Permissions exist to protect:

- Orderly users
- Worker Instances
- conversations
- files
- secrets
- platform resources
- other Workers
- Orderly Core

The fundamental rule is:

> A Worker has no access unless access is explicitly granted.

Worker permissions are declared in `orderly.worker.json`, reviewed by Orderly, and granted to individual Worker Instances according to platform policy and user consent.

---

# 2. Security Model

The permission model follows four layers:

```text
Manifest Request
      │
      ▼
Platform Approval
      │
      ▼
Instance Grant
      │
      ▼
Runtime Enforcement
```

A permission declared in the manifest is only a request.

Example:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write"
  ]
}
```

This does not automatically mean that all permissions are active.

The Runtime MUST use the final granted permission set.

---

# 3. Deny by Default

Any capability not explicitly granted MUST be unavailable.

Example:

```text
Granted:

chat:read-current
chat:write-current
storage:read
storage:write
```

The Worker therefore MUST NOT automatically receive:

```text
location
contacts
email
files
external HTTP
conversation history
other Workers
other instances
```

---

# 4. Permission Format

Permissions use a namespaced string format.

Recommended format:

```text
namespace:action[-scope]
```

Examples:

```text
chat:read-current
chat:write-current

storage:read
storage:write

files:read
files:write

users:read-basic

http:request

secrets:read
```

Permission names MUST be lowercase.

---

# 5. Permission Categories

Initial permission categories SHOULD include:

```text
chat
storage
users
files
http
secrets
workspace
notifications
schedule
instance
```

Future categories MAY include:

```text
location
contacts
payments
devices
identity
workers
ai
```

---

# 6. Permission Scopes

Where appropriate, permissions SHOULD include scope.

Examples:

```text
current
history
instance
owned
shared
```

Scope SHOULD be as narrow as practical.

For example:

```text
chat:read-current
```

is preferred over a broad:

```text
chat:read
```

when the Worker only needs the active message.

---

# 7. Chat Permissions

Chat permissions control access to Orderly conversations and messages.

---

## 7.1 `chat:read-current`

Allows the Worker to read the current message/event sent to the Worker Instance.

Example:

```ts
ctx.message.text
```

This permission MAY expose:

```text
message ID
message type
message content
sender ID
conversation ID
timestamp
```

It MUST NOT automatically expose previous conversation history.

---

## 7.2 `chat:write-current`

Allows the Worker to reply inside the current conversation.

Example:

```ts
await ctx.chat.reply("Saved.");
```

This permission SHOULD be sufficient for most conversational Workers.

---

## 7.3 `chat:read-history`

Allows the Worker to request previous messages from the current conversation.

Example future API:

```ts
await ctx.chat.history({
  limit: 20
});
```

This permission SHOULD be considered more sensitive than `chat:read-current`.

Workers SHOULD NOT request it unless conversation history is genuinely necessary.

---

## 7.4 `chat:send`

Allows the Worker to initiate messages rather than only reply to an active interaction.

Example:

```ts
await ctx.chat.send({
  conversationId: "...",
  text: "Your report is ready."
});
```

This permission SHOULD require stronger user consent because it allows proactive messaging.

---

## 7.5 `chat:write-rich`

Allows sending supported rich interactive messages.

Examples:

```text
cards
buttons
forms
tables
interactive components
```

The platform MAY include this functionality under `chat:write-current` initially.

A separate permission MAY be introduced if richer content carries additional risk.

---

# 8. Storage Permissions

Storage permissions apply only to storage owned by the active Worker Instance.

---

## 8.1 `storage:read`

Allows:

```ts
ctx.storage.get()
ctx.storage.find()
```

The Worker MUST only be able to read:

```text
its own instance storage
```

It MUST NOT read:

```text
Orderly Core tables
another Worker
another instance
```

---

## 8.2 `storage:write`

Allows:

```ts
ctx.storage.insert()
ctx.storage.update()
ctx.storage.delete()
```

This permission MUST remain limited to Worker-owned logical models.

---

# 9. Storage Does Not Mean Database Access

The following interpretation is invalid:

```text
storage:read
=
read Orderly PostgreSQL
```

Correct interpretation:

```text
storage:read
=
read this Worker's instance-scoped storage
```

The Worker Runtime is responsible for enforcing this distinction.

---

# 10. User Permissions

Workers SHOULD receive minimal user information by default.

---

## 10.1 `users:read-basic`

Allows access to limited identity information for users interacting with the Worker.

Example:

```ts
{
  id: "user_123",
  displayName: "Rizal"
}
```

Possible basic data MAY include:

```text
stable user ID
display name
avatar
```

It SHOULD NOT automatically include:

```text
email
phone
billing details
private profile information
```

---

## 10.2 `users:read-profile`

Allows access to additional profile information that is otherwise available according to Orderly privacy rules.

This permission SHOULD be more restricted than `users:read-basic`.

---

## 10.3 Sensitive User Data

Future sensitive permissions SHOULD remain separated.

For example:

```text
users:read-email
users:read-phone
```

A Worker needing a display name SHOULD NOT be required to request access to email or phone numbers.

---

# 11. File Permissions

Workers SHOULD use Orderly-managed file APIs instead of direct filesystem access.

---

## 11.1 `files:read`

Allows the Worker to read files that are explicitly available to the active Worker Instance.

Example:

```ts
await ctx.files.get(fileId);
```

This permission MUST NOT expose arbitrary user or platform files.

---

## 11.2 `files:write`

Allows the Worker to create Worker-associated files.

Example:

```ts
await ctx.files.create({
  name: "report.pdf",
  data: ...
});
```

Files SHOULD remain scoped according to instance ownership and sharing rules.

---

## 11.3 No Filesystem Permission

The Worker permission system SHOULD NOT expose permissions such as:

```text
filesystem:root
filesystem:host
```

Workers MUST NOT receive direct host filesystem access.

---

# 12. External HTTP Permission

## 12.1 `http:request`

Allows a Worker backend to make outbound HTTP or HTTPS requests through the Worker Runtime.

Example:

```ts
await ctx.http.fetch(
  "https://api.example.com/data"
);
```

This MUST NOT imply unrestricted network access.

---

# 13. HTTP Restrictions

The Runtime MAY enforce:

```text
domain allowlists
protocol restrictions
port restrictions
timeouts
maximum request size
maximum response size
redirect limits
rate limits
```

Future manifests MAY declare network destinations.

Example:

```json
{
  "network": {
    "allowed_hosts": [
      "api.example.com"
    ]
  }
}
```

This could provide stronger control than a single unrestricted `http:request` permission.

---

# 14. Private Network Access

Workers MUST NOT be able to use `http:request` to access protected infrastructure such as:

```text
localhost
127.0.0.1
private container networks
cloud metadata endpoints
Orderly internal services
database ports
```

unless a specific trusted platform capability explicitly allows it.

---

# 15. Secrets Permissions

## 15.1 `secrets:read`

Allows backend Worker code to read secrets explicitly configured for the active Worker Instance.

Example:

```ts
const key =
  await ctx.secrets.get("api_key");
```

The Worker MUST only access secrets declared or otherwise assigned to it.

---

# 16. Secret Scope

Secrets MUST be separated by instance.

Example:

```text
Finance Instance A
→ payment_key_A

Finance Instance B
→ payment_key_B
```

Instance A MUST NOT access Instance B's secret.

---

# 17. Frontend Secret Access

Worker frontend code MUST NOT receive `secrets:read` by default.

Secrets SHOULD normally be backend-only.

Example architecture:

```text
Worker Frontend
      │
      ▼
Worker Backend
      │
      ▼
ctx.secrets
```

rather than:

```text
Worker Frontend
      │
      ▼
raw API key
```

---

# 18. Workspace Permissions

Workspace permissions control interactions with the Orderly Worker Workspace shell.

---

## 18.1 `workspace:read`

Allows the Worker to read limited Workspace runtime context.

Possible use:

```text
current page
Workspace state
supported platform features
```

---

## 18.2 `workspace:write`

Allows permitted Workspace actions.

Examples MAY include:

```text
invalidate data
update UI state
navigate within Worker Workspace
show Worker-owned notifications
```

It MUST NOT allow modification of Orderly Core UI outside the Worker boundary.

---

# 19. Notification Permissions

## 19.1 `notifications:send`

Allows a Worker to create Orderly notifications for authorized users.

Example:

```text
Daily report is ready.
```

Because this can generate unsolicited user-visible activity, the platform SHOULD enforce limits.

Possible controls:

```text
rate limits
user preference
notification category
instance membership
```

---

# 20. Schedule Permissions

## 20.1 `schedule:create`

Allows a Worker Instance to create or register scheduled tasks where supported.

Example:

```text
Daily financial summary
Every day at 18:00
```

Scheduled jobs MUST execute using the Worker Instance's permissions.

---

## 20.2 `schedule:manage`

Future implementations MAY separate schedule creation and management.

Possible API:

```ts
ctx.schedule.create()
ctx.schedule.list()
ctx.schedule.update()
ctx.schedule.delete()
```

---

# 21. Instance Permissions

## 21.1 `instance:read-config`

Allows Worker backend code to read instance configuration.

This MAY be implicitly granted to the Worker itself in V1.

---

## 21.2 `instance:write-config`

Allows a Worker to modify instance configuration programmatically.

This SHOULD be more restricted.

Workers SHOULD NOT silently change important user-controlled settings without clear reason.

---

# 22. Owner and Member Information

Future collaborative Worker Instances MAY have:

```text
Owner
Admin
Member
Viewer
```

Permissions to inspect members SHOULD use a separate namespace.

Possible future permissions:

```text
members:read
members:manage
```

These are not required for Permission Specification 0.1.

---

# 23. Future Location Permissions

If location support is introduced, it SHOULD be granular.

Possible permissions:

```text
location:read-approximate
location:read-precise
```

Workers SHOULD request approximate location when precise location is unnecessary.

---

# 24. Future Contacts Permissions

Potential future permissions:

```text
contacts:read
contacts:write
```

Access to user contact lists SHOULD be treated as sensitive.

Most Workers SHOULD NOT need this permission.

---

# 25. Future Payment Permissions

Payment capabilities SHOULD be separated into narrowly scoped permissions.

Possible examples:

```text
payments:create
payments:read-status
payments:refund
```

A Worker capable of creating payment intents does not necessarily require refund authority.

Financial permissions SHOULD require additional platform review.

---

# 26. Future Device Permissions

IoT Workers MAY eventually require:

```text
devices:read
devices:control
```

Device control SHOULD be considered a sensitive capability.

The permission model SHOULD distinguish observing a device from controlling it.

---

# 27. Future Worker-to-Worker Permissions

Cross-Worker interactions MUST NOT rely on direct storage access.

Possible future permission:

```text
workers:call
```

Example:

```text
Finance Worker
      │
      ▼
Inventory Worker public action
```

The target Worker SHOULD explicitly expose callable actions.

---

# 28. Permission Declaration

Worker permissions are declared in:

```text
orderly.worker.json
```

Example:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write"
  ]
}
```

The platform MUST reject unknown permissions unless the active manifest specification explicitly allows experimental namespaces.

---

# 29. Permission Validation

During package validation:

```text
Manifest
   │
   ▼
Read requested permissions
   │
   ▼
Validate permission names
   │
   ▼
Check runtime support
   │
   ▼
Determine review level
```

Unsupported permission requests MUST prevent normal publication unless explicitly allowed for development/testing.

---

# 30. Permission Grant

Permissions SHOULD be granted per Worker Instance.

Example:

```text
Worker Definition
Notes Worker

Requests:
✓ chat:read-current
✓ chat:write-current
✓ storage:read
✓ storage:write
```

Instance:

```text
@notes.rizalsambayu

Granted:
✓ chat:read-current
✓ chat:write-current
✓ storage:read
✓ storage:write
```

Another instance MAY have different permission grants if the platform supports optional capabilities.

---

# 31. Installation Consent

When the user creates an instance, Orderly SHOULD display meaningful permissions.

Do not show only technical permission names.

Instead of:

```text
chat:read-current
storage:write
```

show:

```text
Notes Worker can:

✓ Read messages you send to this Worker
✓ Reply to your conversations with this Worker
✓ Save and manage data for this Worker Instance
```

Technical names MAY be available in an advanced details view.

---

# 32. Permission Grouping

Installation UI MAY group related permissions.

Example:

```text
Chat

✓ Read messages sent to this Worker
✓ Send replies


Data

✓ Store and manage notes for this instance
```

This is preferable to overwhelming users with implementation details.

---

# 33. Permission Changes Between Versions

A Worker update MAY request additional permissions.

Example:

```text
Notes Worker 1.0.0

chat
storage
```

Version:

```text
Notes Worker 1.1.0

chat
storage
http:request
```

Orderly MUST NOT silently grant the new sensitive permission merely because the Worker was updated.

The platform SHOULD require re-approval when permission scope expands.

---

# 34. Permission Reduction

If a new Worker version requires fewer permissions, the platform MAY automatically reduce the active permission set.

Example:

```text
1.0.0:
http:request

1.1.0:
permission removed
```

The instance no longer needs that capability.

---

# 35. Runtime Enforcement

Runtime permission checks are authoritative.

Even if Worker code directly attempts an unavailable capability:

```ts
await ctx.http.fetch(url);
```

without:

```text
http:request
```

the Runtime MUST deny the operation.

---

# 36. SDK Is Not the Security Boundary

A malicious developer could bypass SDK helpers.

Therefore:

```text
SDK checks
≠
security
```

The actual architecture must be:

```text
Worker
   │
   ▼
Runtime Boundary
   │
   ▼
Permission Engine
   │
   ▼
Capability API
```

The Permission Engine or capability service MUST enforce authorization.

---

# 37. Permission Error

Denied operations SHOULD return a standardized error.

Example:

```text
PERMISSION_DENIED
```

Potential structure:

```json
{
  "code": "PERMISSION_DENIED",
  "permission": "http:request"
}
```

Detailed platform internals SHOULD NOT be exposed unnecessarily.

---

# 38. Optional Permissions

Future manifests MAY distinguish required and optional permissions.

Example:

```json
{
  "permissions": {
    "required": [
      "chat:read-current",
      "chat:write-current"
    ],
    "optional": [
      "notifications:send"
    ]
  }
}
```

This allows a Worker to remain functional without optional features.

---

# 39. Recommended V1 Manifest Format

For the first implementation, a simple array is sufficient:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write"
  ]
}
```

Required/optional distinction can be introduced later if needed.

---

# 40. Sensitive Permissions

Some permissions SHOULD trigger stronger review.

Examples may include:

```text
chat:read-history
chat:send
http:request
users:read-profile
notifications:send
location:read-precise
payments:refund
devices:control
```

The Worker Store MAY classify permissions by risk.

---

# 41. Permission Risk Levels

Orderly MAY classify permissions conceptually as:

```text
Standard
Sensitive
Restricted
```

Example:

```text
Standard

chat:read-current
chat:write-current
storage:read
storage:write
```

Sensitive:

```text
chat:read-history
http:request
notifications:send
users:read-profile
```

Restricted:

```text
payments:refund
devices:control
identity:verify
```

Exact classification is controlled by platform policy.

---

# 42. Worker Store Review

Workers requesting high-risk capabilities MAY require additional review.

Possible checks:

```text
publisher verification
manual code review
security testing
privacy policy
usage justification
external service review
```

Worker Store publication and Runtime permissions are related but separate systems.

---

# 43. Permission Revocation

Orderly MUST be able to revoke Worker permissions.

Revocation MAY happen because of:

```text
user action
publisher action
security incident
platform policy
Worker suspension
instance suspension
```

A Worker MUST fail safely after permission revocation.

---

# 44. User-Controlled Permissions

Where practical, users SHOULD be able to review active permissions for a Worker Instance.

Example:

```text
Catatan Kerja
Notes Worker
@notes.rizalsambayu

Permissions

Chat
✓ Read messages sent to Harian
✓ Send replies

Data
✓ Manage Harian data
```

Future optional permissions MAY be individually disabled.

---

# 45. Revocation Example

Suppose a Worker has:

```text
http:request
```

and the user revokes it.

Future calls:

```ts
ctx.http.fetch(...)
```

MUST fail with:

```text
PERMISSION_DENIED
```

The Worker should remain functional where possible.

---

# 46. Instance Ownership Does Not Override Permissions

Even the owner of an instance MUST NOT accidentally grant a Worker access beyond the platform capability boundary.

Example:

```text
User owns instance
```

does not mean:

```text
Worker can read entire user account
```

Permissions remain explicit.

---

# 47. Worker Data Ownership

`storage:*` permissions operate on Worker Instance data.

They do not grant general access to:

```text
user data
conversation database
Orderly Core database
other Worker data
```

This distinction MUST remain consistent across SDK and Runtime documentation.

---

# 48. Capability-Based Architecture

Permissions authorize capabilities.

Example:

```text
Permission:
storage:read
      │
      ▼
Capability:
ctx.storage.find()
```

The Worker never receives the underlying database credentials.

Likewise:

```text
Permission:
chat:write-current
      │
      ▼
Capability:
ctx.chat.reply()
```

The Worker never receives privileged access to the Chat service.

---

# 49. Recommended V1 Permissions

The initial production implementation SHOULD remain small.

Recommended V1 permission catalogue:

```text
chat:read-current
chat:write-current
chat:read-history
chat:send

storage:read
storage:write

users:read-basic

files:read
files:write

http:request

secrets:read

workspace:read
workspace:write

notifications:send

schedule:create
```

Not all permissions need to ship in the first Runtime release.

---

# 50. Minimum Notes Worker Permissions

A basic Notes Worker should require only:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write"
  ]
}
```

It does not need:

```text
contacts
location
external HTTP
conversation history
notifications
```

unless those features are explicitly added.

---

# 51. Example Finance Worker

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write"
  ]
}
```

If it sends automatic daily reports:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "chat:send",
    "storage:read",
    "storage:write",
    "schedule:create"
  ]
}
```

---

# 52. Example External Integration Worker

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "http:request",
    "secrets:read"
  ]
}
```

The installation interface can explain:

```text
This Worker can:

✓ Read messages sent to it
✓ Reply to messages
✓ Connect to external internet services
✓ Use credentials configured for this instance
```

---

# 53. Example Restaurant Worker

Possible permission set:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write",
    "workspace:read",
    "workspace:write",
    "notifications:send"
  ]
}
```

This is still isolated from:

```text
user email
contacts
other Workers
Orderly database
host filesystem
```

---

# 54. Permission Naming Stability

Once Permission Specification reaches stable `1.0`, permission names SHOULD be treated as public API.

Renaming:

```text
chat:read-current
```

to:

```text
messages:read-active
```

would be a breaking specification change.

Therefore permission names SHOULD remain conservative and predictable.

---

# 55. Deprecated Permissions

If a permission becomes obsolete:

```text
deprecated
      │
      ▼
migration period
      │
      ▼
replacement permission
```

The platform SHOULD provide developers with migration guidance.

---

# 56. Permission Aliases

The Runtime SHOULD avoid indefinite support for multiple names referring to the same permission.

A canonical permission name SHOULD exist.

Temporary aliases MAY be used during migration.

---

# 57. Unknown Permissions

A package containing:

```json
{
  "permissions": [
    "superadmin:everything"
  ]
}
```

MUST be rejected if that permission is unknown.

Workers MUST NOT be able to invent capabilities by inventing permission strings.

---

# 58. Permission Inheritance

Permission namespaces SHOULD NOT implicitly grant broader capabilities.

For example:

```text
storage:write
```

SHOULD NOT automatically mean:

```text
storage:read
```

unless explicitly documented.

Workers needing both should request:

```text
storage:read
storage:write
```

This keeps permission intent visible.

---

# 59. Runtime Internal Permissions

Orderly MAY use internal capabilities that are not available to third-party Workers.

These MUST NOT be accepted merely because a Worker adds them to its manifest.

For example:

```text
core:database
core:admin
core:auth-internal
```

MUST remain unavailable.

---

# 60. Official Workers

Official status MUST NOT imply unrestricted Core access. Orderly Assistant and other system-managed Workers MUST use narrow, auditable capabilities for account mutations, invitation responses, public directory search, and activity writes. AI output MUST NOT bypass runtime authorization or confirmation policy. Capability grants to another Worker Instance MUST be explicit, scoped to the target instance and role, revocable, and non-transitive by default. See `Orderly Assistant Design Guide.md`.

Official Orderly Workers SHOULD use the same public permission model whenever practical.

Example:

```text
Orderly Notes Worker
```

should use:

```text
chat:read-current
chat:write-current
storage:read
storage:write
```

rather than undocumented direct Core access.

This helps validate that third-party developers have a sufficiently capable platform.

---

# 61. Permission Audit

The platform SHOULD record important permission events.

Examples:

```text
permission granted
permission revoked
permission changed
new permission requested by update
restricted permission used
```

Possible audit data:

```text
timestamp
instance
Worker version
permission
actor
result
```

---

# 62. Runtime Audit

Sensitive capability calls MAY additionally be audited.

Example:

```text
Worker:
External CRM

Instance:
@crm.rizalsambayu

Capability:
http:request

Destination:
api.example.com
```

Sensitive payload contents SHOULD NOT automatically be logged.

---

# 63. Permission Display

Worker Store detail pages SHOULD show requested permissions before instance creation.

Example:

```text
Permissions

Chat
• Read messages sent directly to this Worker
• Send replies

Storage
• Save and manage this Worker's data

Network
• None
```

This allows users to compare Workers before using them.

---

# 64. Permission Change Warning

When an update adds permissions:

```text
Notes Worker 2.0 needs new access:

+ Connect to external internet services
```

Orderly SHOULD inform the user before enabling that capability.

The platform MAY keep the instance on its existing Worker version until permission approval occurs.

---

# 65. Instance Creation Flow

Recommended permission flow:

```text
Worker Store
      │
      ▼
Worker Detail
      │
      ▼
Use
      │
      ▼
Create Instance
      │
      ├── Instance Label / Name Segment
      ├── Configuration
      └── Permission Summary
      │
      ▼
User Confirms
      │
      ▼
Create Instance
      │
      ▼
Store Granted Permissions
```

---

# 66. Permission Data Model

Conceptually:

```text
worker_instance_permissions
---------------------------
id
instance_id
permission
status
granted_at
revoked_at
```

Example:

```text
instance:
@notes.rizalsambayu

permission:
chat:read-current

status:
granted
```

The actual database implementation is platform-specific.

---

# 67. Worker Definition Permission Data

The platform SHOULD separately retain permissions requested by each Worker version.

Conceptually:

```text
worker_version_permissions
--------------------------
worker_version_id
permission
```

This allows comparison between releases.

Example:

```text
1.0.0
storage:read
storage:write

1.1.0
storage:read
storage:write
http:request
```

Orderly can detect:

```text
new permission:
http:request
```

---

# 68. Permission Comparison During Update

Worker update flow SHOULD calculate:

```text
old permissions
      │
      ▼
new permissions
      │
      ▼
difference
```

Possible results:

```text
unchanged
reduced
expanded
```

Expanded permissions MAY require approval.

---

# 69. Default Worker Permissions

A Worker SHOULD receive no implicit broad permissions simply because it exists.

The platform MAY provide minimal runtime functionality needed for execution, such as:

```text
instance identity
event metadata
logging
```

These are runtime primitives rather than broad data permissions.

---

# 70. Public Information

Orderly MAY expose public information without a sensitive permission where equivalent data is already publicly visible.

However, the platform SHOULD remain careful about bulk access.

A Worker being able to view one public profile MUST NOT necessarily imply the right to scrape every public profile.

---

# 71. Rate Limits

Permissions do not imply unlimited usage.

Example:

```text
notifications:send
```

allows notifications but Orderly MAY still enforce:

```text
10 per minute
100 per day
```

Likewise:

```text
http:request
```

may be subject to outbound request limits.

---

# 72. Billing and Permissions

Some capabilities MAY require paid platform resources.

For example:

```text
AI execution
large storage
high-volume notifications
external network traffic
```

Permission and billing are separate.

A Worker may have permission but still encounter quota or billing limits.

---

# 73. Failure Modes

Capability calls SHOULD distinguish:

```text
PERMISSION_DENIED
QUOTA_EXCEEDED
RATE_LIMITED
FEATURE_UNAVAILABLE
INSTANCE_DISABLED
```

This allows Workers to respond appropriately.

---

# 74. Principle of Least Privilege

Developers SHOULD request only permissions required by current functionality.

Bad:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:read-history",
    "chat:send",
    "storage:read",
    "storage:write",
    "users:read-profile",
    "files:read",
    "files:write",
    "http:request",
    "notifications:send"
  ]
}
```

for a Worker that only stores notes.

Better:

```json
{
  "permissions": [
    "chat:read-current",
    "chat:write-current",
    "storage:read",
    "storage:write"
  ]
}
```

---

# 75. Security Principle

Permission declarations answer:

> What is this Worker allowed to ask Orderly to do?

They do not answer:

> What can this code technically attempt to do?

Worker code may attempt anything.

The Runtime boundary MUST ensure only authorized capabilities succeed.

Therefore:

```text
Untrusted Worker Code
        │
        ▼
Permission-Enforced Runtime
        │
        ▼
Capability API
        │
        ▼
Orderly
```

is the required architecture.

---

# 76. Recommended Permission Matrix

| Capability | Permission | Default Risk |
|---|---|---|
| Read current message | `chat:read-current` | Standard |
| Reply to current chat | `chat:write-current` | Standard |
| Read history | `chat:read-history` | Sensitive |
| Initiate chat | `chat:send` | Sensitive |
| Read Worker data | `storage:read` | Standard |
| Modify Worker data | `storage:write` | Standard |
| Read basic user data | `users:read-basic` | Standard |
| Read richer profile | `users:read-profile` | Sensitive |
| Read Worker files | `files:read` | Standard |
| Create Worker files | `files:write` | Standard |
| External HTTP | `http:request` | Sensitive |
| Read instance secrets | `secrets:read` | Sensitive |
| Read Workspace context | `workspace:read` | Standard |
| Control Workspace | `workspace:write` | Standard |
| Send notifications | `notifications:send` | Sensitive |
| Create schedules | `schedule:create` | Sensitive |

Risk classifications are advisory and MAY change as the platform evolves.

---

# 77. V1 Recommendation

For the first Worker Platform release, implement permission enforcement for:

```text
chat:read-current
chat:write-current

storage:read
storage:write

http:request
secrets:read
```

Then add:

```text
users:read-basic
files:read
files:write
workspace:read
workspace:write
notifications:send
schedule:create
chat:read-history
chat:send
```

after the core security model is proven.

---

# 78. Summary

The Orderly Worker permission model is:

```text
Worker Manifest
      │
      ▼
Requested Permissions
      │
      ▼
Worker Store / Platform Review
      │
      ▼
User Instance Consent
      │
      ▼
Granted Permissions
      │
      ▼
Worker Runtime
      │
      ▼
Capability Enforcement
```

A Worker never receives unrestricted platform access.

Every capability is:

```text
explicit
scoped
permission-controlled
runtime-enforced
auditable
revocable
```

This allows third-party Workers to be powerful while keeping Orderly Core, users, and unrelated Worker Instances isolated.

# 75. Knowledge and connection grants

Instance knowledge permissions MUST distinguish upload/manage from runtime retrieval and MUST apply ACL filtering before content reaches a model. Editing instance instructions does not grant tools, files, contacts, network, or connected-Worker access.

Worker-to-Worker grants bind source instance, target instance, capability identifier/version, role/scope, grantor, expiry, and revocation state. Grants are least-privilege, non-transitive by default, and audited. Read, write, financial, physical, and irreversible actions require separate risk and confirmation policy. See `Orderly Worker AI, Knowledge, and Connection Specification.md`.

---

**Orderly Worker Permission Specification — Draft 0.1**
