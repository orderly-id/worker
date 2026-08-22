# Orderly Worker SDK Specification

**Status:** Draft  
**SDK Version:** 0.1  
**Project:** Orderly Worker  
**Proposed Package:** `@orderly/worker-sdk`

---

## 1. Purpose

The Orderly Worker SDK provides the developer-facing API used to build Workers for the Orderly platform.

The SDK is responsible for providing a stable programming interface for:

- defining a Worker
- handling Worker events
- accessing instance information
- reading and writing Worker storage
- sending chat responses
- exposing Worker API handlers
- reading configuration
- accessing secrets
- making permitted HTTP requests
- logging
- interacting with Workspace features
- using other Orderly capabilities

The primary SDK principle is:

> Developers should build Workers against the Worker SDK, not against Orderly Core internals.

---

# 2. Package

The initial JavaScript/TypeScript SDK is proposed as:

```bash
npm install @orderly/worker-sdk
```

or:

```bash
bun add @orderly/worker-sdk
```

A Worker entrypoint may then import:

```ts
import { defineWorker } from "@orderly/worker-sdk";
```

---

# 3. Basic Worker

A minimal Worker:

```ts
import { defineWorker } from "@orderly/worker-sdk";

export default defineWorker({
  async onMessage(ctx) {
    await ctx.chat.reply("Hello from Worker.");
  }
});
```

This Worker:

```text
receives a chat message
        ↓
executes onMessage()
        ↓
sends a reply
```

---

# 4. `defineWorker()`

`defineWorker()` defines the Worker runtime handlers.

Example:

```ts
import { defineWorker } from "@orderly/worker-sdk";

export default defineWorker({
  async onMessage(ctx) {
    // ...
  },

  async onInstanceCreated(ctx) {
    // ...
  }
});
```

The function SHOULD provide compile-time typing where supported.

Conceptual type:

```ts
defineWorker({
  onMessage?: Handler,
  onInstanceCreated?: Handler,
  onInstanceUpdated?: Handler,
  onSchedule?: Handler,
  routes?: Record<string, RouteHandler>
})
```

Exact handler names MAY evolve before SDK 1.0.

---

# 5. Execution Context

Every Worker handler receives a context object:

```ts
ctx
```

The context represents the current Worker execution.

Conceptually:

```ts
ctx.instance
ctx.event
ctx.chat
ctx.storage
ctx.config
ctx.secrets
ctx.http
ctx.files
ctx.users
ctx.workspace
ctx.log
```

Capabilities that are not granted to the Worker MUST NOT provide unrestricted functionality.

---

# 6. Context Overview

Example:

```ts
export default defineWorker({
  async onMessage(ctx) {
    console.log(ctx.instance.instanceName);

    const message = ctx.message.text;

    await ctx.storage.insert("notes", {
      content: message
    });

    await ctx.chat.reply("Note saved.");
  }
});
```

---

# 7. `ctx.instance`

Provides information about the active Worker Instance.

Example:

```ts
ctx.instance.id
ctx.instance.workerId
ctx.instance.label
ctx.instance.nameSegment
ctx.instance.instanceName
ctx.instance.ownerUsername
ctx.instance.workerSlug
ctx.instance.workerVersion
```

Possible conceptual interface:

```ts
interface WorkerInstance {
  id: string;
  workerId: string;
  label: string | null;
  nameSegment: string;
  instanceName: string;
  ownerUsername: string;
  workerSlug: string;
  workerVersion: string;
}
```

`instanceName` is the complete public handle and MUST use `@{nameSegment}.{ownerUsername}`. It maps to `/{instanceName}` (for example `/@notes.rizalsambayu`). `label` is only an optional display label. SDK code MUST use `id` for storage, permission, and event scope. Instance creation is a Core lifecycle operation and MUST reject a second owned instance for the same user and Worker Definition.

Example values:

```text
id:
550e8400-e29b-41d4-a716-446655440000

workerId:
wrk_01k2notes000000000000000001

label:
Catatan Kerja

nameSegment:
notes

instanceName:
@notes.rizalsambayu

ownerUsername:
rizalsambayu

workerSlug:
notes

workerVersion:
1.0.0
```

---

# 8. `ctx.event`

Provides metadata about the current runtime event.

Example:

```ts
ctx.event.id
ctx.event.type
ctx.event.timestamp
```

Conceptual interface:

```ts
interface WorkerEvent {
  id: string;
  type: string;
  timestamp: string;
}
```

Example:

```text
evt_01J...

chat.message

2026-08-11T10:00:00Z
```

---

# 9. Chat Events

For chat-related handlers, the context SHOULD expose:

```ts
ctx.message
```

Example:

```ts
ctx.message.id
ctx.message.type
ctx.message.text
ctx.message.sender
ctx.message.conversationId
```

Conceptual type:

```ts
interface ChatMessage {
  id: string;
  type: "text" | "image" | "file" | "other";
  text?: string;
  sender: {
    id: string;
  };
  conversationId: string;
}
```

Only data permitted by the active capabilities SHOULD be available.

---

# 10. `onMessage`

The primary conversational handler.

Example:

```ts
export default defineWorker({
  async onMessage(ctx) {
    if (!ctx.message.text) {
      return;
    }

    await ctx.chat.reply(
      `Received: ${ctx.message.text}`
    );
  }
});
```

`onMessage` SHOULD be invoked for permitted `chat.message` events.

---

# 11. `ctx.chat`

Provides access to chat-related capabilities.

Initial conceptual API:

```ts
ctx.chat.reply()
ctx.chat.send()
```

Future versions MAY support:

```ts
ctx.chat.history()
ctx.chat.edit()
ctx.chat.delete()
ctx.chat.react()
```

These features MUST remain permission-controlled.

---

# 12. `ctx.chat.reply()`

Replies to the current conversation.

Example:

```ts
await ctx.chat.reply("Note saved.");
```

Structured message:

```ts
await ctx.chat.reply({
  type: "text",
  text: "Note saved."
});
```

The SDK SHOULD support convenient shorthand for text messages.

---

# 13. Structured Chat Response

Workers MAY return structured content.

Example:

```ts
await ctx.chat.reply({
  type: "card",
  title: "Today's Expenses",
  body: "Rp350.000"
});
```

Supported message types are defined by the Chat Capability specification.

The SDK MUST NOT allow arbitrary client-side code through chat payloads.

---

# 14. `ctx.chat.send()`

Sends a message to an explicitly allowed conversation or destination.

Conceptual example:

```ts
await ctx.chat.send({
  conversationId: "conv_123",
  text: "Daily report is ready."
});
```

This operation SHOULD require broader permission than replying to the current message.

---

# 15. `ctx.storage`

Provides access to instance-scoped Worker storage.

Initial API:

```ts
ctx.storage.insert()
ctx.storage.get()
ctx.storage.find()
ctx.storage.update()
ctx.storage.delete()
```

Worker developers operate on logical models declared in `orderly.worker.json`.

---

# 16. `ctx.storage.insert()`

Example:

```ts
const note = await ctx.storage.insert("notes", {
  title: "Meeting",
  content: "Discuss Worker Runtime"
});
```

Return value:

```ts
{
  id: "...",
  title: "Meeting",
  content: "Discuss Worker Runtime"
}
```

The SDK SHOULD validate model names against the Worker manifest.

---

# 17. `ctx.storage.get()`

Fetches a record by identifier.

Example:

```ts
const note = await ctx.storage.get(
  "notes",
  noteId
);
```

If no record exists, the method SHOULD return:

```ts
null
```

rather than expose storage-specific exceptions.

---

# 18. `ctx.storage.find()`

Queries Worker data.

Example:

```ts
const notes = await ctx.storage.find("notes", {
  where: {
    archived: false
  },
  limit: 20
});
```

Potential query shape:

```ts
{
  where?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
  limit?: number;
  offset?: number;
}
```

The SDK SHOULD expose a storage abstraction rather than raw SQL.

---

# 19. `ctx.storage.update()`

Example:

```ts
const note = await ctx.storage.update(
  "notes",
  noteId,
  {
    title: "Updated Meeting"
  }
);
```

---

# 20. `ctx.storage.delete()`

Example:

```ts
await ctx.storage.delete(
  "notes",
  noteId
);
```

Delete behavior SHOULD be defined consistently by the platform.

---

# 21. No Raw SQL

The SDK MUST NOT expose unrestricted SQL access.

Not allowed:

```ts
ctx.db.query(
  "SELECT * FROM orderly_users"
);
```

Preferred:

```ts
ctx.storage.find("notes");
```

This keeps Worker data portable and isolated.

---

# 22. `ctx.config`

Provides access to Worker Instance configuration.

Example:

```ts
const currency =
  ctx.config.get("currency");
```

Potential API:

```ts
ctx.config.get(key)
ctx.config.has(key)
```

Configuration values come from instance setup or Worker settings.

---

# 23. Example Configuration

Manifest:

```json
{
  "configuration": {
    "fields": [
      {
        "key": "currency",
        "type": "select"
      }
    ]
  }
}
```

Worker:

```ts
const currency =
  ctx.config.get("currency") ?? "IDR";
```

---

# 24. `ctx.secrets`

Provides secure access to declared Worker secrets.

Example:

```ts
const apiKey = await ctx.secrets.get(
  "external_api_key"
);
```

Secrets MUST be scoped to the Worker Instance.

The SDK MUST NOT expose unrelated platform secrets.

---

# 25. Missing Secrets

If a required secret does not exist, the SDK SHOULD throw a structured Worker error.

Example conceptual error:

```ts
{
  code: "SECRET_NOT_CONFIGURED",
  key: "external_api_key"
}
```

Workers SHOULD be able to detect and handle this condition.

---

# 26. `ctx.http`

Provides controlled outbound HTTP requests.

Example:

```ts
const response = await ctx.http.fetch(
  "https://api.example.com/data"
);
```

The API MAY resemble standard `fetch()` where practical.

Example:

```ts
const response = await ctx.http.fetch(
  "https://api.example.com/orders",
  {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      id: "123"
    })
  }
);
```

Network access MUST remain permission-controlled.

---

# 27. HTTP Restrictions

The Runtime MAY restrict:

```text
domains
ports
methods
protocols
timeouts
request size
response size
redirects
```

The SDK SHOULD return structured errors when a request is blocked.

Example:

```text
HTTP_DOMAIN_NOT_ALLOWED
HTTP_TIMEOUT
HTTP_RESPONSE_TOO_LARGE
```

---

# 28. `ctx.log`

Provides structured logging.

Example:

```ts
ctx.log.info("Note created");

ctx.log.warn("External API response slow");

ctx.log.error("Failed to save note");
```

Potential methods:

```ts
ctx.log.debug()
ctx.log.info()
ctx.log.warn()
ctx.log.error()
```

---

# 29. Structured Logs

Workers SHOULD be able to attach metadata.

Example:

```ts
ctx.log.info("Note created", {
  noteId: note.id
});
```

The Runtime SHOULD automatically associate logs with:

```text
Worker
Worker version
Instance
Execution ID
Timestamp
```

---

# 30. Sensitive Logging

Worker developers SHOULD NOT log:

```text
API keys
passwords
access tokens
private credentials
full payment credentials
```

Orderly MAY automatically redact recognized sensitive values.

---

# 31. `ctx.users`

Provides access to permitted user information.

Example:

```ts
const user =
  await ctx.users.getCurrentSender();
```

Potential result:

```ts
{
  id: "user_123",
  displayName: "Example User"
}
```

Access MUST be permission-controlled.

A Worker MUST NOT automatically receive full user profiles.

---

# 32. User Privacy

The SDK SHOULD expose the minimum information required for the Worker operation.

For example, basic chat processing may only require:

```text
user ID
display name
```

rather than:

```text
email
phone
billing information
private profile fields
```

More sensitive fields MUST require separate permissions.

---

# 33. `ctx.files`

Provides controlled Worker file operations.

Potential API:

```ts
ctx.files.create()
ctx.files.get()
ctx.files.delete()
```

Example:

```ts
const file = await ctx.files.create({
  name: "report.pdf",
  data: report
});
```

The exact file data interface may vary by runtime.

---

# 34. File Isolation

Worker files MUST be scoped through the Worker Platform.

Workers MUST NOT receive unrestricted filesystem paths such as:

```text
/etc
/home
/var
Orderly source directories
```

---

# 35. `ctx.workspace`

Provides Workspace-related functionality.

Potential API:

```ts
ctx.workspace.navigate()
ctx.workspace.notify()
ctx.workspace.invalidate()
```

Example:

```ts
await ctx.workspace.invalidate(
  "notes-list"
);
```

Exact Workspace APIs are defined separately.

---

# 36. UI Actions

Workers MAY expose named actions that the frontend can invoke.

Example:

```text
create-note
delete-note
archive-note
```

A Worker UI SHOULD invoke actions through an approved bridge rather than directly calling internal Orderly APIs.

---

# 37. Worker Routes

The SDK SHOULD support named route handlers.

Example:

```ts
export default defineWorker({
  routes: {
    "notes.list": async (ctx) => {
      const notes =
        await ctx.storage.find("notes");

      return {
        status: 200,
        body: notes
      };
    },

    "notes.create": async (ctx) => {
      const note =
        await ctx.storage.insert(
          "notes",
          ctx.request.body
        );

      return {
        status: 201,
        body: note
      };
    }
  }
});
```

The manifest maps routes to named handlers.

---

# 38. Manifest Route Mapping

Manifest:

```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/notes",
      "handler": "notes.list"
    },
    {
      "method": "POST",
      "path": "/notes",
      "handler": "notes.create"
    }
  ]
}
```

SDK:

```ts
routes: {
  "notes.list": listNotes,
  "notes.create": createNote
}
```

This keeps route definitions declarative.

---

# 39. `ctx.request`

Route handlers SHOULD receive normalized request information.

Example:

```ts
ctx.request.method
ctx.request.params
ctx.request.query
ctx.request.body
ctx.request.headers
```

The Runtime MAY filter or normalize headers before exposing them.

---

# 40. Route Response

Recommended response shape:

```ts
return {
  status: 200,
  body: {
    success: true
  }
};
```

Optional headers MAY be allowed:

```ts
return {
  status: 200,
  headers: {
    "content-type": "application/json"
  },
  body: data
};
```

Restricted headers SHOULD be controlled by the Runtime.

---

# 41. Lifecycle Handlers

The SDK MAY support Worker Instance lifecycle handlers.

Possible handlers:

```ts
onInstanceCreated
onInstanceUpdated
onInstanceDisabled
onInstanceDeleted
```

Example:

```ts
export default defineWorker({
  async onInstanceCreated(ctx) {
    await ctx.storage.insert(
      "folders",
      {
        name: "Default"
      }
    );
  }
});
```

---

# 42. `onInstanceCreated`

This handler runs after an instance has been created and initialized sufficiently for Worker execution.

Potential uses:

```text
create default records
initialize settings
prepare starter content
send welcome message
```

Workers SHOULD NOT rely on this event for security-critical provisioning unless delivery guarantees are defined.

---

# 43. Scheduled Handlers

The SDK MAY support named scheduled handlers.

Example:

```ts
export default defineWorker({
  schedules: {
    "reports.daily": async (ctx) => {
      // generate report
    }
  }
});
```

Manifest:

```json
{
  "schedule": [
    {
      "name": "daily-report",
      "cron": "0 18 * * *",
      "handler": "reports.daily"
    }
  ]
}
```

---

# 44. Webhook Handlers

Example:

```ts
export default defineWorker({
  webhooks: {
    "payments.update": async (ctx) => {
      const payload = ctx.request.body;

      // process webhook
    }
  }
});
```

Manifest:

```json
{
  "webhooks": [
    {
      "name": "payment-update",
      "path": "/payment",
      "handler": "payments.update"
    }
  ]
}
```

---

# 45. Error Model

The SDK SHOULD provide structured Worker errors.

Conceptual example:

```ts
import {
  WorkerError
} from "@orderly/worker-sdk";

throw new WorkerError(
  "NOTE_NOT_FOUND",
  "The requested note does not exist."
);
```

---

# 46. Worker Error Shape

Conceptual format:

```ts
{
  code: string;
  message: string;
  details?: unknown;
}
```

Runtime-level errors SHOULD use reserved error codes.

Examples:

```text
PERMISSION_DENIED
INSTANCE_DISABLED
STORAGE_MODEL_NOT_FOUND
SECRET_NOT_CONFIGURED
HTTP_DOMAIN_NOT_ALLOWED
EXECUTION_TIMEOUT
```

---

# 47. User-Safe Errors

The SDK SHOULD distinguish developer errors from end-user-facing messages where useful.

Example:

```ts
throw new WorkerError(
  "INVALID_NOTE",
  "Note content is required.",
  {
    expose: true
  }
);
```

Internal stack traces MUST NOT automatically be exposed to users.

---

# 48. Type Safety

The TypeScript SDK SHOULD provide types generated from or compatible with Worker manifest definitions where practical.

Example goal:

```ts
ctx.storage.insert("notes", {
  title: "Hello",
  content: "..."
});
```

could eventually provide compile-time validation for declared models.

This feature MAY be implemented through code generation.

---

# 49. Generated Worker Types

Future CLI:

```bash
orderly worker generate
```

could generate:

```text
.orderly/
└── worker-types.d.ts
```

based on:

```text
orderly.worker.json
```

The generated types may include:

```text
data models
configuration
secrets
routes
events
```

---

# 50. Example Generated Model Type

Manifest:

```json
{
  "name": "notes",
  "fields": {
    "id": {
      "type": "uuid"
    },
    "title": {
      "type": "string"
    }
  }
}
```

Generated conceptual TypeScript:

```ts
interface Notes {
  id: string;
  title?: string;
}
```

---

# 51. Worker Structure

Recommended TypeScript Worker structure:

```text
notes-worker/
│
├── orderly.worker.json
│
├── backend/
│   ├── index.ts
│   ├── chat.ts
│   ├── routes/
│   │   └── notes.ts
│   └── services/
│       └── notes.ts
│
├── frontend/
│   └── ...
│
└── README.md
```

---

# 52. Example `backend/index.ts`

```ts
import {
  defineWorker
} from "@orderly/worker-sdk";

import {
  onMessage
} from "./chat";

import {
  listNotes,
  createNote,
  deleteNote
} from "./routes/notes";

export default defineWorker({
  onMessage,

  routes: {
    "notes.list": listNotes,
    "notes.create": createNote,
    "notes.delete": deleteNote
  }
});
```

---

# 53. Example Chat Handler

```ts
export async function onMessage(ctx) {
  const text = ctx.message.text?.trim();

  if (!text) {
    return;
  }

  const note = await ctx.storage.insert(
    "notes",
    {
      content: text,
      created_at: new Date().toISOString()
    }
  );

  ctx.log.info("Note created", {
    noteId: note.id
  });

  await ctx.chat.reply(
    "Catatan disimpan."
  );
}
```

---

# 54. Example Route

```ts
export async function listNotes(ctx) {
  const notes = await ctx.storage.find(
    "notes",
    {
      orderBy: {
        created_at: "desc"
      },
      limit: 100
    }
  );

  return {
    status: 200,
    body: {
      data: notes
    }
  };
}
```

---

# 55. Example Complete Notes Worker

Manifest:

```json
{
  "schema_version": "1",
  "name": "Notes Worker",
  "slug": "notes",
  "version": "1.0.0",
  "description": "Create and manage notes.",

  "backend": {
    "runtime": "bun",
    "entry": "backend/index.ts"
  },

  "permissions": [
    "chat:read",
    "chat:write",
    "storage:read",
    "storage:write"
  ],

  "events": [
    "chat.message"
  ],

  "routes": [
    {
      "method": "GET",
      "path": "/notes",
      "handler": "notes.list"
    }
  ],

  "data": {
    "models": [
      {
        "name": "notes",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "content": {
            "type": "text",
            "required": true
          },
          "created_at": {
            "type": "datetime"
          }
        }
      }
    ]
  }
}
```

Backend:

```ts
import {
  defineWorker
} from "@orderly/worker-sdk";

export default defineWorker({
  async onMessage(ctx) {
    const text = ctx.message.text;

    if (!text) {
      return;
    }

    await ctx.storage.insert(
      "notes",
      {
        content: text,
        created_at: new Date().toISOString()
      }
    );

    await ctx.chat.reply(
      "Catatan disimpan."
    );
  },

  routes: {
    "notes.list": async (ctx) => {
      const notes =
        await ctx.storage.find("notes");

      return {
        status: 200,
        body: notes
      };
    }
  }
});
```

---

# 56. Capability Availability

The SDK package MAY contain typings for all supported capabilities.

However, Runtime access MUST still depend on permissions.

For example, TypeScript may know:

```ts
ctx.location
```

but an instance without permission MUST NOT gain access to location data.

Runtime authorization remains authoritative.

---

# 57. Capability Errors

When a Worker attempts an unavailable operation, the SDK SHOULD return or throw:

```text
PERMISSION_DENIED
```

Example:

```ts
try {
  await ctx.http.fetch(url);
} catch (error) {
  if (
    error.code === "PERMISSION_DENIED"
  ) {
    // handle gracefully
  }
}
```

---

# 58. SDK and Runtime Separation

The SDK is not the security boundary.

The Runtime is.

This is important because Worker developers may bypass SDK helper functions or modify bundled JavaScript.

Therefore:

```text
SDK
→ developer convenience

Runtime
→ actual enforcement
```

All security checks MUST be enforced by the Runtime or trusted platform services.

---

# 59. SDK Versioning

SDK version and Worker version are separate.

Example:

```text
Worker:
Notes Worker 2.3.0

SDK:
@orderly/worker-sdk 1.4.0
```

The platform SHOULD document supported SDK/runtime compatibility.

---

# 60. Backward Compatibility

Stable SDK releases SHOULD avoid breaking existing Workers unnecessarily.

Breaking changes SHOULD use:

```text
major SDK version
```

or:

```text
new Worker API version
```

where appropriate.

---

# 61. Deprecated APIs

Deprecated SDK APIs SHOULD:

```text
remain functional for a documented period
emit development warnings where practical
provide migration guidance
```

Orderly SHOULD avoid silently removing stable capabilities.

---

# 62. Developer Runtime

The SDK SHOULD work with a local Worker development environment.

Example:

```bash
orderly worker dev
```

The local runtime may provide:

```text
test instance
mock chat
local Worker storage
API route testing
Workspace preview
logs
permission simulation
```

---

# 63. Development Context

A developer SHOULD be able to simulate:

```ts
onMessage({
  message: {
    text: "Catat meeting besok"
  }
});
```

without deploying to production.

The development runtime SHOULD mimic production SDK contracts.

---

# 64. Testing Utilities

The SDK MAY provide test utilities.

Possible future package:

```ts
import {
  createTestWorker
} from "@orderly/worker-sdk/testing";
```

Example:

```ts
const worker = createTestWorker(
  definition
);

const result = await worker.message(
  "hello"
);
```

This is optional for SDK 0.1.

---

# 65. No Orderly Core Imports

Worker packages MUST NOT depend on internal packages such as:

```text
@orderly/core
@orderly/database
@orderly/auth-internal
@orderly/chat-internal
```

Only documented public packages SHOULD be used.

Example:

```text
@orderly/worker-sdk
```

---

# 66. Standard Worker API Surface

The initial SDK SHOULD prioritize a small, stable API.

Recommended V1:

```text
defineWorker()

ctx.instance
ctx.event
ctx.message

ctx.chat
├── reply
└── send

ctx.storage
├── insert
├── get
├── find
├── update
└── delete

ctx.config
└── get

ctx.secrets
└── get

ctx.http
└── fetch

ctx.log
├── debug
├── info
├── warn
└── error
```

Additional capabilities SHOULD be added only when a real Worker use case requires them.

---

# 67. Recommended Permission Mapping

Conceptually:

```text
ctx.chat.reply
→ chat:write

ctx.chat.send
→ chat:write

ctx.storage.get
→ storage:read

ctx.storage.find
→ storage:read

ctx.storage.insert
→ storage:write

ctx.storage.update
→ storage:write

ctx.storage.delete
→ storage:write

ctx.http.fetch
→ http:request

ctx.secrets.get
→ secrets:read
```

Exact permission names are defined by the Permission Specification.

---

# 68. SDK Design Principles

### Small Core

The basic SDK should remain easy to understand.

### Stable Contracts

Developer-facing APIs should not depend on Orderly internal architecture.

### Runtime-Enforced Security

The SDK helps developers but does not enforce security by itself.

### Instance Awareness

Every Worker execution should naturally operate within one Worker Instance.

### Portable Storage

Workers should use logical storage APIs instead of database-specific queries.

### Permission Awareness

Sensitive functionality should require explicit capabilities.

### Good TypeScript Experience

The SDK should provide strong types and clear errors.

### Minimal Boilerplate

A useful Worker should require very little setup.

---

# 69. Minimal Developer Experience Goal

Creating a functional Worker should eventually be possible with something close to:

```bash
orderly worker create notes
cd notes
bun install
orderly worker dev
```

Then:

```ts
import {
  defineWorker
} from "@orderly/worker-sdk";

export default defineWorker({
  async onMessage(ctx) {
    await ctx.chat.reply(
      `You said: ${ctx.message.text}`
    );
  }
});
```

The developer should not need to configure:

```text
Phoenix
Orderly database
Orderly authentication
WebSocket internals
Worker routing internals
deployment infrastructure
```

to build a basic Worker.

---

# 70. Example: Finance Worker

```ts
import {
  defineWorker
} from "@orderly/worker-sdk";

export default defineWorker({
  async onMessage(ctx) {
    const text = ctx.message.text;

    if (!text) {
      return;
    }

    const transaction =
      parseTransaction(text);

    if (!transaction) {
      await ctx.chat.reply(
        "Saya tidak dapat mengenali transaksi tersebut."
      );

      return;
    }

    await ctx.storage.insert(
      "transactions",
      transaction
    );

    await ctx.chat.reply(
      `Tercatat: ${transaction.amount}`
    );
  }
});
```

The parsing implementation belongs to the Worker.

Orderly only provides the runtime and capabilities.

---

# 71. Example: External Integration Worker

```ts
import {
  defineWorker
} from "@orderly/worker-sdk";

export default defineWorker({
  async onMessage(ctx) {
    const apiKey =
      await ctx.secrets.get(
        "service_api_key"
      );

    const response =
      await ctx.http.fetch(
        "https://api.example.com/search",
        {
          headers: {
            authorization:
              `Bearer ${apiKey}`
          }
        }
      );

    const data =
      await response.json();

    await ctx.chat.reply({
      type: "text",
      text: data.result
    });
  }
});
```

Manifest permissions:

```json
{
  "permissions": [
    "chat:read",
    "chat:write",
    "http:request",
    "secrets:read"
  ]
}
```

---

# 72. Example: Worker With API and Chat

A Worker does not need to choose between chat and API.

It may support both.

```ts
export default defineWorker({
  async onMessage(ctx) {
    // conversational interface
  },

  routes: {
    "items.list": async (ctx) => {
      // Workspace/API interface
    },

    "items.create": async (ctx) => {
      // Workspace/API interface
    }
  }
});
```

Both interfaces can use the same:

```text
storage
configuration
business logic
instance
permissions
```

---

# 73. Service Layer Recommendation

For larger Workers, developers SHOULD separate business logic from SDK handlers.

Example:

```text
backend/
├── index.ts
├── handlers/
│   ├── chat.ts
│   └── routes.ts
└── services/
    └── notes.ts
```

Example service:

```ts
export async function createNote(
  storage,
  input
) {
  return storage.insert(
    "notes",
    input
  );
}
```

This improves testability and reduces coupling to event handlers.

---

# 74. SDK Non-Goals

The SDK does not provide:

```text
unrestricted database access
Orderly Core internals
host filesystem access
host process control
unrestricted network sockets
privileged authentication credentials
direct access to another Worker
```

Such behavior would violate the Worker isolation model.

---

# 75. Future SDK Capabilities

The SDK MAY later expose typed rich-message actions, invitation commands, public directory search, account setting capabilities, and activity recording for approved system Workers. These APIs MUST remain runtime-enforced and MUST NOT expose raw Core database access. The Orderly Assistant direction is documented in `Orderly Assistant Design Guide.md`.

Potential future namespaces:

```text
ctx.notifications
ctx.schedule
ctx.location
ctx.payments
ctx.identity
ctx.contacts
ctx.jobs
ctx.ai
ctx.devices
ctx.members
ctx.permissions
```

They SHOULD be introduced as separate capabilities rather than expanding a single unrestricted API.

---

# 76. Future Worker-to-Worker API

A future version MAY allow one Worker to interact with another Worker through a controlled capability.

Conceptually:

```ts
ctx.workers.call({
  instance: "@inventory.rizalsambayu",
  action: "stock.check",
  input: {
    productId: "..."
  }
});
```

This MUST NOT provide direct access to another Worker's storage or runtime.

Cross-Worker interaction should use explicit contracts and permissions.

---

# 77. Future AI Capability

Orderly MAY eventually expose platform-managed AI functionality.

Conceptually:

```ts
const result =
  await ctx.ai.generate({
    model: "default",
    input: "Summarize these notes."
  });
```

This capability would require separate policy, billing, limits, and permissions.

It is not part of SDK 0.1.

---

# 78. Worker SDK Contract

The core relationship is:

```text
Worker Source
     │
     ▼
@orderly/worker-sdk
     │
     ▼
Runtime Contract
     │
     ▼
Worker Runtime
     │
     ▼
Capability API
     │
     ▼
Orderly Platform
```

Worker developers depend on the SDK.

The SDK depends on the public Runtime contract.

The Runtime translates Worker operations into trusted Orderly platform operations.

---

# 79. Recommended Initial Implementation

For SDK 0.1, implement only:

```text
defineWorker

ctx.instance
ctx.event
ctx.message

ctx.chat.reply

ctx.storage.insert
ctx.storage.get
ctx.storage.find
ctx.storage.update
ctx.storage.delete

ctx.config.get

ctx.secrets.get

ctx.http.fetch

ctx.log
```

Then add:

```text
chat.send
files
users
workspace
schedule
webhooks
```

after the fundamental runtime is stable.

This keeps the first SDK small enough to implement and test correctly.

---

# 80. Summary

A developer should be able to think about an Orderly Worker like this:

```ts
export default defineWorker({
  async onMessage(ctx) {

    // read input
    const text =
      ctx.message.text;

    // use Worker-owned data
    await ctx.storage.insert(
      "notes",
      {
        content: text
      }
    );

    // interact with Orderly
    await ctx.chat.reply(
      "Saved."
    );
  }
});
```

The SDK hides the internal complexity of:

```text
authentication
Worker instance resolution
database isolation
routing
event dispatch
permission enforcement
runtime sandboxing
Orderly Core integration
```

while the Runtime remains responsible for actual security enforcement.

# 79. AI, knowledge, and connection SDK direction

The SDK SHOULD expose typed, permission-aware interfaces for `ctx.ai`, `ctx.knowledge`, and `ctx.connections`. `ctx.ai` proposes structured actions; it never grants authority. `ctx.knowledge.search()` returns authorized citations rather than implicitly injecting all files. `ctx.connections.call()` invokes only a granted capability declared by both packages and returns schema-validated output.

Instance instructions SHOULD be available as validated configuration, separate from the immutable Worker system prompt. SDK tests SHOULD run prompt examples/evals and capability contract fixtures. See `Orderly Worker AI, Knowledge, and Connection Specification.md`.

# 80. `onAction` package execution

An AI-capable package MAY implement `onAction(action, context)`. The handler MUST return a versioned envelope containing `action`, user-safe `reply`, bounded `operations`, and `output`. Operations request injected capabilities such as `storage.create`; they do not execute database code in the package process.

The host MUST validate the returned action against the manifest schema, each resource against declared models, each capability against granted permissions, operation IDs/count, and output references. Package execution MUST run outside the Core VM with bounded time and filesystem/network/process permissions. The Notes `0.2.0` package is the reference implementation.

---

**Orderly Worker SDK Specification — Draft 0.1**
