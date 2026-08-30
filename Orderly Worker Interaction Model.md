# Orderly Worker Interaction Model

Status: active architecture contract. The initial route and Assistant-chat cutover is implemented; remaining envelope, capability, and audit gaps are tracked in the root `WORKER_PROGRESS.md`.

## 1. Core model

Orderly separates the conversational surface from the Worker that owns domain behavior:

```text
User
  |
  v
@assistant.username
  |
  +--> #notes.username
  +--> #fnb-oms.username
  +--> #other-instance.username
```

`@assistant.username` is the user's built-in **Orderly Assistant**. It is the only Worker with a user-facing chat interface. Every other Worker Instance remains usable in two ways:

1. conversationally through the authenticated user's Orderly Assistant; or
2. visually through that instance's Workspace.

Removing the per-instance chat interface does not remove Worker prompts, actions, AI behavior, storage, realtime events, permissions, connections, or Workspace features. It only centralizes conversation in Orderly Assistant.

## 2. Identity, reference, and route

These identifiers have different purposes and MUST NOT be conflated:

| Form | Meaning | Example |
| --- | --- | --- |
| `@username` | user identity or profile mention | `@rizalsambayu` |
| `@assistant.username` | built-in Assistant identity and chat destination | `@assistant.rizalsambayu` |
| `#instance.username` | conversational reference to a Worker Instance | `#notes.rizalsambayu` |
| internal UUID | authoritative identity for authorization, storage, events, and relations | `550e8400-...` |

Public URLs intentionally contain no `@` or `#` symbols:

| Entity | Route | Example |
| --- | --- | --- |
| user profile | `/user/{username}` | `/user/rizalsambayu` |
| Orderly Assistant | `/assistant/{username}` | `/assistant/rizalsambayu` |
| Worker Instance | `/instance/{instance-name}.{owner-username}` | `/instance/notes.rizalsambayu` |

The namespaces prevent usernames from colliding with routes such as `/chat`, `/login`, or `/worker`. The `#instance.username` form is only a human-readable reference/mention used in chat, search, selectors, activity, and management UI. It is not a database key, proof of access, or URL.

After resolving a mention, Core MUST use the internal instance UUID. User input, AI output, and Worker code MUST NOT construct authority by parsing the reference.

## 3. Interaction surfaces

### 3.1 Assistant Chat

Assistant Chat is the sole conversational Worker surface. A user may address an instance explicitly:

```text
#notes.rizalsambayu buat catatan Rapat di folder Kerja.
```

Assistant may also resolve an omitted reference from unambiguous active context or a user-configured default. If more than one authorized target is plausible, Assistant MUST ask for clarification instead of guessing.

The resulting execution envelope SHOULD carry at least:

```text
actor_user_id
assistant_instance_id
target_worker_instance_id
target_worker_version
action
arguments
conversation_id
correlation_id
authorization snapshot/reference
```

The target Worker still owns intent rules, prompts, action schemas, validation, and domain result text. Assistant coordinates the request and presents the result; it does not absorb domain logic into Assistant-specific `if/else` branches.

### 3.2 Assistant Workspace

Assistant Workspace under `/assistant/{username}/*` is the user's control surface for notifications, action history, account actions, connected Worker Instances, knowledge made available to Assistant, instance access management, and permission-aware coordination.

### 3.3 Worker Instance Workspace

Each non-Assistant instance keeps its own Dashboard at `/instance/{instance-name}.{owner-username}` and Workspace below that route for rich domain UI such as note editors, catalogs, orders, invoice forms, bookings, maps, device controls, and reports. Workspace mutations use the same action, permission, audit, and storage contracts as requests initiated through Assistant Chat.

### 3.4 No per-instance chat interface

Non-Assistant instances MUST NOT expose an independent chat thread or chat page. SDK chat handlers and response helpers, where retained for compatibility, operate within the current Assistant conversation and target-instance execution context. They do not create a second conversation owned by the target instance.

## 4. Capability registration and execution

When an instance is created or added to an account, Core SHOULD automatically register its Assistant-facing capabilities, action schemas, reference metadata, and permission requirements with that user's Assistant. Registration means the capability can be discovered; it does not grant new authority.

For every action, Core MUST verify:

- the actor's access to the target instance;
- the actor's current role and capability grant;
- the target package's declared action and schema;
- confirmation requirements and risk class;
- instance and resource scope;
- idempotency, rate limits, and audit requirements.

Assistant MUST NOT gain raw database access, bypass an instance's owner/editor/guest rules, inherit transitive access, or execute a connected Worker's capability without an explicit grant.

## 5. Ownership and shared access

Each user owns exactly one Assistant. The Assistant acts with the authority of the authenticated actor, not automatically with the authority of the target instance owner.

Example: User2 is an Editor of User1's Notes. User2 may ask `@assistant.user2` to act on `#notes.user1`. Core records User2 as actor and permits only actions available to the Editor role. User1's Assistant is not impersonated and ownership is unchanged.

For analytics that currently distinguish `worker` and `workspace` channels, an action initiated through Assistant Chat remains channel `worker`; an action initiated in the target Workspace remains channel `workspace`. The actor is always the authenticated user.

## 6. Knowledge and connections

Knowledge remains layered and scoped:

- Worker package knowledge defines versioned domain behavior;
- instance knowledge belongs to one Worker Instance;
- Assistant knowledge contains user-level instructions or documents deliberately added to Assistant;
- connected Worker data is retrieved through typed, authorized capabilities and is not copied wholesale into Assistant memory.

Connections are explicit, scoped, revocable, audited, and non-transitive by default. A connected Notes instance may answer a permitted `notes.search` request from another Worker, but the caller does not receive Notes storage or unrelated records.

## 7. Notifications and proactive actions

Workers may publish authorized events. Assistant can present them as notifications, activity records, or structured actions. A proactive notification does not authorize the next mutation. Sensitive, financial, physical, destructive, external, or irreversible actions remain subject to their confirmation policy.

## 8. Migration and backward compatibility

The initial migration keeps legacy `/@...` routes only as redirects and keeps old non-Assistant Worker messages as authorized read-only history. Vue no longer exposes those instances as chat entries, and Core rejects new non-Assistant message POSTs. New conversation rows belong to the actor's Assistant instance and contain resolved target metadata. Existing user data MUST NOT be silently deleted during later schema cleanup.

During later migration and cleanup:

- do not create a parallel Assistant system;
- reuse the existing Worker Gateway, package actions, permissions, and audit contracts;
- keep new non-Assistant chat threads disabled until legacy readers are intentionally retired;
- retain explicit redirects from legacy `/@username`, `/@assistant.username`, and `/@instance.username` routes to the new symbol-free namespaces;
- keep public identities and internal UUIDs stable while changing only the URL contract;
- update tests to prove that Assistant Chat and Workspace produce equivalent authorized domain actions;
- document every temporary compatibility adapter in `WORKER_PROGRESS.md`.

## 9. Contributor rule

Contributors build Worker capabilities and Workspaces, not standalone chat applications. A Worker package SHOULD provide domain prompts/actions, schemas, permissions, knowledge declarations, handlers, Workspace UI, and tests. Orderly Assistant provides the shared conversational shell and routes validated actions to the selected instance.
