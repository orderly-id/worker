# Orderly Worker Manifest Specification

**Status:** Draft  
**Manifest Version:** 0.1  
**File Name:** `orderly.worker.json`

---

## 1. Purpose

The `orderly.worker.json` file is the machine-readable definition of an Orderly Worker.

It tells the Orderly Worker Platform:

- what the Worker is
- which Worker specification it targets
- how the Worker backend is executed
- how the Worker frontend is loaded
- which permissions it requires
- which events it handles
- which API routes it exposes
- which data models it requires
- how Worker Instances are configured
- which assets and metadata belong to the Worker

The manifest MUST be located at the root of the Worker Package.

Example package:

```text
notes-worker.zip
│
├── orderly.worker.json
├── backend/
├── frontend/
├── assets/
└── README.md
```

---

# 2. Minimal Manifest

A minimal Worker manifest may look like:

```json
{
  "schema_version": "1",
  "name": "Notes Worker",
  "slug": "notes",
  "version": "1.0.0",
  "description": "Create and manage notes through Orderly.",
  "backend": {
    "runtime": "bun",
    "entry": "backend/index.ts"
  }
}
```

---

# 3. Complete Example

```json
{
  "schema_version": "1",

  "name": "Notes Worker",
  "slug": "notes",
  "version": "1.0.0",

  "description": "Create and manage notes through chat and Workspace.",

  "publisher": {
    "name": "Example Developer"
  },

  "assets": {
    "icon": "assets/icon.png",
    "banner": "assets/banner.png"
  },

  "backend": {
    "runtime": "bun",
    "entry": "backend/index.ts"
  },

  "frontend": {
    "type": "sandbox",
    "entry": "frontend/index.ts"
  },

  "permissions": [
    "chat:read",
    "chat:write",
    "storage:read",
    "storage:write"
  ],

  "events": [
    "chat.message",
    "instance.created"
  ],

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
          "title": {
            "type": "string",
            "required": true
          },
          "content": {
            "type": "text"
          },
          "created_at": {
            "type": "datetime"
          }
        }
      }
    ]
  },

  "instance": {
    "fields": [
      {
        "key": "name",
        "label": "Instance Name",
        "type": "text",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "type": "textarea",
        "required": false
      }
    ]
  }
}
```

---

# 4. Top-Level Fields

The manifest MAY contain the following top-level fields:

```text
schema_version
name
slug
version
description
publisher
assets
backend
frontend
permissions
events
routes
data
instance
configuration
secrets
schedule
webhooks
dependencies
limits
```

Some fields are required while others are optional.

---

# 5. `schema_version`

Required.

Defines the version of the Worker Manifest Specification targeted by the package.

Example:

```json
{
  "schema_version": "1"
}
```

The platform MAY support multiple schema versions simultaneously.

A Worker Package MUST be rejected if its schema version is unsupported.

---

# 6. `name`

Required.

Human-readable Worker name.

Example:

```json
{
  "name": "Notes Worker"
}
```

Requirements:

- MUST be a string
- SHOULD be concise
- SHOULD NOT be used as the permanent internal identifier
- MAY contain spaces

Example names:

```text
Notes Worker
Finance Worker
Booking Worker
Restaurant Worker
IoT Worker
```

---

# 7. `slug`

Required.

Stable human-readable identifier for the Worker Definition.

Example:

```json
{
  "slug": "notes"
}
```

Recommended format:

```text
lowercase
letters
numbers
hyphens
```

Valid examples:

```text
notes
finance
restaurant-pos
iot-controller
```

Invalid examples:

```text
Notes Worker
Finance_Worker
finance worker
@notes
```

The platform MUST validate slug uniqueness within the appropriate publisher namespace.

---

# 8. `version`

Required.

Defines the Worker release version.

Example:

```json
{
  "version": "1.2.0"
}
```

Workers SHOULD follow semantic versioning:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
1.0.0
1.1.0
1.1.1
2.0.0
```

Worker release version and manifest schema version are separate concepts.

---

# 9. `description`

Required.

Short description of the Worker.

Example:

```json
{
  "description": "Create and manage notes through chat and Workspace."
}
```

This description MAY be displayed in the Worker Store.

Long-form documentation SHOULD be placed in `README.md`.

---

# 10. `publisher`

Optional in packages created locally.

Published Workers MUST have an associated publisher identity.

Example:

```json
{
  "publisher": {
    "name": "Example Developer"
  }
}
```

The platform MUST NOT trust arbitrary publisher identity declarations from uploaded packages as proof of ownership.

The actual publisher identity SHOULD be determined by the authenticated Orderly developer account.

Therefore, fields inside `publisher` are informational unless otherwise specified.

---

# 11. `assets`

Optional.

Defines Worker assets.

Example:

```json
{
  "assets": {
    "icon": "assets/icon.png",
    "banner": "assets/banner.png"
  }
}
```

Possible fields include:

```text
icon
banner
screenshots
```

Example:

```json
{
  "assets": {
    "icon": "assets/icon.png",
    "banner": "assets/banner.png",
    "screenshots": [
      "assets/screenshots/01.png",
      "assets/screenshots/02.png"
    ]
  }
}
```

All asset paths MUST resolve inside the Worker Package.

Paths MUST NOT escape the package root.

Invalid:

```text
../../secret.txt
```

---

# 12. `backend`

Optional.

Defines Worker backend execution.

Example:

```json
{
  "backend": {
    "runtime": "bun",
    "entry": "backend/index.ts"
  }
}
```

## 12.1 `runtime`

Defines the required Worker runtime.

Example:

```json
{
  "runtime": "bun"
}
```

Initial Orderly Worker implementations MAY support only a limited set of runtimes.

A package requiring an unsupported runtime MUST be rejected.

The runtime list is platform-defined.

---

## 12.2 `entry`

Defines the backend entrypoint.

Example:

```json
{
  "entry": "backend/index.ts"
}
```

The entrypoint MUST:

- exist inside the package
- remain inside the package root
- be compatible with the declared runtime

---

# 13. `frontend`

Optional.

Defines Worker Workspace frontend behavior.

Example:

```json
{
  "frontend": {
    "type": "sandbox",
    "entry": "frontend/index.ts"
  }
}
```

Possible frontend types MAY include:

```text
schema
sandbox
none
```

---

## 13.1 Schema Frontend

A declarative Worker UI.

Example:

```json
{
  "frontend": {
    "type": "schema",
    "entry": "frontend/workspace.json"
  }
}
```

Orderly renders the UI using supported platform components.

---

## 13.2 Sandbox Frontend

A custom frontend executed inside an isolated Worker UI environment.

Example:

```json
{
  "frontend": {
    "type": "sandbox",
    "entry": "frontend/index.ts"
  }
}
```

A sandbox frontend MUST NOT receive unrestricted access to the Orderly application environment.

---

## 13.3 No Frontend

Chat-only Workers MAY declare:

```json
{
  "frontend": {
    "type": "none"
  }
}
```

or omit `frontend`.

---

# 14. `permissions`

Optional.

Defines capabilities requested by the Worker.

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

Permission declaration does not automatically grant a capability.

The platform determines whether a requested permission is allowed.

Possible permission categories may include:

```text
chat
storage
users
files
notifications
schedule
http
location
workspace
```

Examples:

```text
chat:read
chat:write

storage:read
storage:write

users:read-profile

files:read
files:write

notifications:send

schedule:create

http:request

location:read
```

The available permission list MUST be defined separately by the Orderly Worker Permission Specification.

---

# 15. `events`

Optional.

Defines Worker events the Worker wants to handle.

Example:

```json
{
  "events": [
    "chat.message",
    "instance.created"
  ]
}
```

Possible events may include:

```text
chat.message
chat.command
instance.created
instance.updated
instance.deleted
schedule.triggered
webhook.received
workspace.opened
```

The actual event catalogue is defined by the Worker Event Specification.

A Worker MUST NOT receive events it has no permission to receive.

---

# 16. `routes`

Optional.

Defines API handlers exposed by the Worker.

Example:

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

Each route MUST define:

```text
method
path
handler
```

---

## 16.1 `method`

Allowed HTTP methods MAY include:

```text
GET
POST
PUT
PATCH
DELETE
```

Example:

```json
{
  "method": "POST"
}
```

---

## 16.2 `path`

Route path relative to the Worker Instance namespace.

Example:

```json
{
  "path": "/notes"
}
```

The Worker MUST NOT define absolute Orderly Core routes.

Invalid:

```text
/api/users
/login
/admin
```

The Worker Gateway handles namespace routing.

Conceptually:

```text
Worker route:
/notes

Public/internal resolved route:
/api/workers/:instance/notes
```

---

## 16.3 `handler`

Identifies a backend Worker handler.

Example:

```json
{
  "handler": "notes.create"
}
```

The exact handler resolution mechanism depends on the Worker Runtime.

---

# 17. `data`

Optional.

Defines Worker-owned persistent data structures.

Example:

```json
{
  "data": {
    "models": []
  }
}
```

Worker data definitions MUST NOT modify Orderly Core tables.

---

# 18. `data.models`

Defines logical Worker data models.

Example:

```json
{
  "data": {
    "models": [
      {
        "name": "notes",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "title": {
            "type": "string",
            "required": true
          },
          "content": {
            "type": "text"
          }
        }
      }
    ]
  }
}
```

Orderly MAY implement these models using:

```text
physical database tables
namespaced database schemas
generic storage tables
document storage
another isolated persistence model
```

The manifest describes the logical model, not necessarily the physical database implementation.

---

# 19. Data Field Definition

A field may contain:

```text
type
required
primary
unique
default
nullable
index
reference
```

Example:

```json
{
  "email": {
    "type": "string",
    "required": true,
    "unique": true
  }
}
```

---

# 20. Supported Data Types

Initial supported logical types MAY include:

```text
string
text
integer
decimal
boolean
uuid
datetime
date
json
```

Example:

```json
{
  "amount": {
    "type": "decimal"
  }
}
```

The platform MAY introduce additional types in future schema versions.

---

# 21. Primary Keys

Example:

```json
{
  "id": {
    "type": "uuid",
    "primary": true
  }
}
```

A model SHOULD have one primary identifier.

If a Worker does not explicitly declare a primary identifier, the platform MAY generate one automatically.

---

# 22. References

Worker models MAY reference other models owned by the same Worker.

Example:

```json
{
  "folder_id": {
    "type": "uuid",
    "reference": {
      "model": "folders",
      "field": "id"
    }
  }
}
```

Workers MUST NOT directly create foreign keys into Orderly Core database tables.

Core resources MUST be accessed through platform capabilities.

---

# 23. Example Multiple Models

```json
{
  "data": {
    "models": [
      {
        "name": "folders",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "name": {
            "type": "string",
            "required": true
          }
        }
      },
      {
        "name": "notes",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "folder_id": {
            "type": "uuid",
            "reference": {
              "model": "folders",
              "field": "id"
            }
          },
          "content": {
            "type": "text"
          }
        }
      }
    ]
  }
}
```

---

# 24. Instance Configuration

The `instance` field describes how users create Worker Instances.

Example:

```json
{
  "instance": {
    "fields": [
      {
        "key": "name",
        "label": "Instance Name",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

Orderly MAY use this metadata to automatically generate the Create Instance interface.

---

# 25. Standard Instance Name

Every Worker Instance MUST have a display name.

Orderly SHOULD provide the standard `name` field even if the Worker does not declare it explicitly.

Conceptually:

```text
Instance Name
[ Harian ]
```

The Worker MAY declare additional instance-specific fields.

---

# 26. Additional Instance Fields

Example Finance Worker:

```json
{
  "instance": {
    "fields": [
      {
        "key": "name",
        "label": "Instance Name",
        "type": "text",
        "required": true
      },
      {
        "key": "business_name",
        "label": "Business Name",
        "type": "text",
        "required": true
      },
      {
        "key": "currency",
        "label": "Currency",
        "type": "select",
        "required": true,
        "options": [
          {
            "label": "Indonesian Rupiah",
            "value": "IDR"
          },
          {
            "label": "US Dollar",
            "value": "USD"
          }
        ]
      }
    ]
  }
}
```

Orderly could generate:

```text
Finance Worker

Instance Name
[ Toko Utama ]

Business Name
[ Toko Sembada ]

Currency
[ Indonesian Rupiah ▼ ]

[ Create Instance ]
```

---

# 27. Instance Field Types

Initial instance configuration types MAY include:

```text
text
textarea
number
boolean
select
multiselect
date
datetime
```

Sensitive values MUST NOT use ordinary instance fields.

They SHOULD use secrets.

---

# 28. `configuration`

Optional.

Defines configurable Worker settings that can be changed after instance creation.

Example:

```json
{
  "configuration": {
    "fields": [
      {
        "key": "default_folder",
        "label": "Default Folder",
        "type": "text"
      }
    ]
  }
}
```

The platform MAY automatically generate a Worker Settings interface from these definitions.

---

# 29. Difference Between `instance` and `configuration`

`instance` fields are primarily used during instance creation.

`configuration` fields are ongoing settings.

Example:

```text
Instance

Name:
Toko Malioboro

Business Name:
Malioboro Coffee
```

Later:

```text
Configuration

Timezone:
Asia/Jakarta

Currency:
IDR

Notifications:
Enabled
```

A field MAY be editable after creation if allowed by the platform.

---

# 30. `secrets`

Optional.

Declares secret values required by the Worker.

Example:

```json
{
  "secrets": [
    {
      "key": "openai_api_key",
      "label": "OpenAI API Key",
      "required": true
    }
  ]
}
```

Secrets MAY include:

```text
API keys
access tokens
webhook secrets
private credentials
```

Secret values MUST NOT be stored inside `orderly.worker.json`.

The manifest only declares required secrets.

Actual secret values MUST be managed through Orderly's secure secret storage.

---

# 31. Secret Access

Backend Worker code MAY access declared secrets through an approved API.

Conceptually:

```ts
const apiKey = await ctx.secrets.get("openai_api_key");
```

Workers MUST NOT receive access to secrets belonging to another Worker Instance.

---

# 32. `schedule`

Optional.

Defines scheduled Worker tasks.

Example:

```json
{
  "schedule": [
    {
      "name": "daily-summary",
      "cron": "0 18 * * *",
      "handler": "reports.daily"
    }
  ]
}
```

The platform MAY reject unsupported scheduling expressions.

Scheduled execution MUST remain scoped to Worker Instances.

---

# 33. `webhooks`

Optional.

Defines Worker webhook handlers.

Example:

```json
{
  "webhooks": [
    {
      "name": "payment-update",
      "path": "/payment",
      "handler": "payments.webhook"
    }
  ]
}
```

Orderly SHOULD generate a scoped webhook URL.

Conceptually:

```text
https://orderly.id/hooks/workers/{instance}/{webhook}
```

Exact URL structure is implementation-defined.

---

# 34. External HTTP Access

Workers requiring outgoing internet access SHOULD declare an appropriate permission.

Example:

```json
{
  "permissions": [
    "http:request"
  ]
}
```

The platform MAY restrict:

```text
domains
request methods
ports
protocols
response sizes
timeouts
```

A Worker MUST NOT assume unrestricted network access.

---

# 35. `dependencies`

Optional.

Defines Worker-specific dependencies.

Example:

```json
{
  "dependencies": {
    "npm": {
      "zod": "^4.0.0"
    }
  }
}
```

The exact dependency system is runtime-specific.

Orderly MAY instead require dependencies to be bundled during package build.

For security and reproducibility, production Worker packages SHOULD avoid installing arbitrary dependencies during execution.

---

# 36. Recommended Dependency Model

The preferred model is:

```text
Developer environment
       │
       ▼
Install dependencies
       │
       ▼
Build Worker
       │
       ▼
Bundle dependencies
       │
       ▼
Upload Worker Package
```

Rather than:

```text
Upload package
       │
       ▼
Production runtime executes npm install
```

---

# 37. `limits`

Optional.

Workers MAY declare expected resource requirements.

Example:

```json
{
  "limits": {
    "memory_mb": 128,
    "timeout_ms": 5000
  }
}
```

Requested limits are advisory.

The platform MAY enforce lower or higher platform-controlled limits.

A Worker MUST NOT control its own security limits.

---

# 38. Reserved Fields

Fields beginning with:

```text
orderly_
```

SHOULD be reserved for platform use.

Example:

```text
orderly_internal
orderly_runtime
```

Third-party manifests SHOULD NOT define arbitrary reserved fields.

---

# 39. Unknown Fields

During draft specification versions, the platform MAY reject unknown manifest fields.

After schema stabilization, future-compatible implementations MAY choose to ignore unknown optional fields.

Strict validation is recommended before version `1.0`.

---

# 40. File Paths

All paths declared in the manifest MUST:

- be relative paths
- resolve inside the Worker Package
- not contain directory traversal
- reference existing files where required

Valid:

```text
backend/index.ts
frontend/index.ts
assets/icon.png
```

Invalid:

```text
/backend/index.ts
../index.ts
../../etc/passwd
```

---

# 41. Package Integrity

The platform SHOULD validate:

```text
ZIP integrity
manifest presence
path safety
entrypoint existence
asset existence
duplicate files
maximum package size
unsupported file types
```

Packages containing unsafe path structures MUST be rejected.

---

# 42. Manifest Validation

Validation SHOULD happen before Worker execution.

Conceptual flow:

```text
Upload
  │
  ▼
Extract safely
  │
  ▼
Read orderly.worker.json
  │
  ▼
Schema validation
  │
  ▼
Path validation
  │
  ▼
Runtime validation
  │
  ▼
Permission validation
  │
  ▼
Data model validation
  │
  ▼
Route validation
  │
  ▼
Security validation
```

---

# 43. Route Conflicts

Routes only need to be unique inside the Worker Definition.

For example:

```text
Notes Worker

GET /notes
```

and:

```text
Finance Worker

GET /notes
```

do not conflict because each Worker is namespaced.

However, two identical route definitions inside the same Worker SHOULD be rejected.

---

# 44. Model Name Conflicts

Worker data model names only need to be unique inside the Worker Definition.

Example:

```text
Notes Worker
notes
```

and:

```text
Research Worker
notes
```

may coexist.

The physical storage implementation MUST preserve isolation.

---

# 45. Manifest Immutability

A published Worker version SHOULD be immutable.

If:

```text
Notes Worker
1.0.0
```

is published, uploading different code with the same Worker version SHOULD NOT overwrite the existing release.

The developer SHOULD publish:

```text
1.0.1
```

or another new version.

This supports:

```text
rollback
auditing
reproducibility
version pinning
security review
```

---

# 46. Package Hash

The platform SHOULD calculate a cryptographic hash for every published Worker Package.

Conceptually:

```text
Worker:
notes

Version:
1.0.0

Package hash:
sha256:...
```

The hash can be used for:

```text
integrity validation
audit records
release immutability
cache validation
security investigation
```

---

# 47. Example: Notes Worker

```json
{
  "schema_version": "1",

  "name": "Notes Worker",
  "slug": "notes",
  "version": "1.0.0",

  "description": "Create and manage notes through Orderly.",

  "assets": {
    "icon": "assets/icon.png"
  },

  "backend": {
    "runtime": "bun",
    "entry": "backend/index.ts"
  },

  "frontend": {
    "type": "sandbox",
    "entry": "frontend/index.ts"
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
    },
    {
      "method": "POST",
      "path": "/notes",
      "handler": "notes.create"
    },
    {
      "method": "DELETE",
      "path": "/notes/:id",
      "handler": "notes.delete"
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
          "title": {
            "type": "string"
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
  },

  "instance": {
    "fields": [
      {
        "key": "name",
        "label": "Instance Name",
        "type": "text",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "type": "textarea"
      }
    ]
  }
}
```

---

# 48. Example: Restaurant Worker

```json
{
  "schema_version": "1",

  "name": "Restaurant Worker",
  "slug": "restaurant",
  "version": "1.0.0",

  "description": "Manage menus, tables, orders, and reservations.",

  "backend": {
    "runtime": "bun",
    "entry": "backend/index.ts"
  },

  "frontend": {
    "type": "sandbox",
    "entry": "frontend/index.ts"
  },

  "permissions": [
    "chat:read",
    "chat:write",
    "storage:read",
    "storage:write",
    "notifications:send"
  ],

  "events": [
    "chat.message"
  ],

  "routes": [
    {
      "method": "GET",
      "path": "/menu",
      "handler": "menu.list"
    },
    {
      "method": "POST",
      "path": "/orders",
      "handler": "orders.create"
    },
    {
      "method": "GET",
      "path": "/tables",
      "handler": "tables.list"
    }
  ],

  "data": {
    "models": [
      {
        "name": "menu_items",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "price": {
            "type": "decimal",
            "required": true
          },
          "available": {
            "type": "boolean",
            "default": true
          }
        }
      },

      {
        "name": "tables",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "capacity": {
            "type": "integer"
          },
          "status": {
            "type": "string"
          }
        }
      },

      {
        "name": "orders",
        "fields": {
          "id": {
            "type": "uuid",
            "primary": true
          },
          "status": {
            "type": "string"
          },
          "total": {
            "type": "decimal"
          },
          "created_at": {
            "type": "datetime"
          }
        }
      }
    ]
  },

  "instance": {
    "fields": [
      {
        "key": "name",
        "label": "Instance Name",
        "type": "text",
        "required": true
      },
      {
        "key": "business_name",
        "label": "Restaurant Name",
        "type": "text",
        "required": true
      },
      {
        "key": "currency",
        "label": "Currency",
        "type": "select",
        "required": true,
        "options": [
          {
            "label": "IDR",
            "value": "IDR"
          },
          {
            "label": "USD",
            "value": "USD"
          }
        ]
      }
    ]
  }
}
```

---

# 49. Recommended Initial V1 Scope

To keep the first Worker implementation maintainable, Orderly Worker Manifest v1 SHOULD initially support only:

```text
Identity
├── schema_version
├── name
├── slug
├── version
└── description

Package
├── assets
├── backend
└── frontend

Platform
├── permissions
├── events
└── routes

Data
└── models

Instance
├── creation fields
└── configuration
```

Features such as:

```text
advanced scheduling
webhooks
dependencies
resource limits
advanced secret policy
cross-Worker dependencies
```

MAY remain experimental until the core Worker Runtime is stable.

---

# 50. Design Principle

The Worker Manifest describes what the Worker needs.

It does not give the Worker unrestricted control of the Orderly platform.

For example:

```json
{
  "data": {
    "models": [...]
  }
}
```

means:

> This Worker requires these logical data models.

It does NOT mean:

> Execute arbitrary SQL against the Orderly database.

Likewise:

```json
{
  "routes": [...]
}
```

means:

> Expose these handlers through the Worker Gateway.

It does NOT mean:

> Modify the Orderly Core router.

And:

```json
{
  "frontend": {...}
}
```

means:

> Load this UI through the Worker frontend runtime.

It does NOT mean:

> Merge this code into the Orderly frontend application.

This separation is fundamental to the Orderly Worker architecture.

---

# 51. Summary

A Worker Package can define previously unknown functionality through a single manifest.

```text
orderly.worker.json
        │
        ├── Identity
        ├── Backend
        ├── Frontend
        ├── Permissions
        ├── Events
        ├── API Routes
        ├── Data Models
        ├── Instance Setup
        ├── Configuration
        └── Platform Requirements
```

Orderly then interprets that definition through controlled platform services:

```text
Manifest
   │
   ▼
Worker Platform
   │
   ├── Worker Runtime
   ├── Worker Gateway
   ├── Worker Storage
   ├── Worker UI Runtime
   ├── Permission Engine
   └── Instance Manager
```

This allows third-party developers to create new applications without modifying Orderly Core.

---

**Orderly Worker Manifest Specification — Draft 0.1**