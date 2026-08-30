# Orderly Worker AI, Knowledge, and Connection Specification

Status: architecture contract and incremental implementation guide. This document complements the Worker, Manifest, Runtime, SDK, and Permission specifications. Where a prototype implementation is narrower, this contract describes the target and the prototype limitation must remain documented in `WORKER_PROGRESS.md`.

## 1. Purpose

Orderly must support Workers with very different domains—Notes, invoice, menu/catalog, parking, coworking booking, IoT, finance, automation, and future contributor-defined applications—without adding domain-specific branches to Orderly Core for every Worker.

Core owns trusted concerns: identity, authentication, instance resolution, authorization, permission grants, storage isolation, secrets, event delivery, confirmation, audit, resource limits, and package lifecycle. A Worker package owns domain behavior: prompts, tools/actions, schemas, handlers, knowledge, UI declaration, and tests.

AI is optional. A deterministic Worker MUST be able to use the same action, capability, event, storage, and connection contracts without an AI provider.

Orderly Assistant is the only user-facing Worker chat interface. Non-Assistant Workers retain their domain AI, prompts, actions, storage, events, connections, and Workspaces, but conversational requests reach them through Assistant using a reference such as `#notes.username`. See `Orderly Worker Interaction Model.md`.

## 2. Instruction and context hierarchy

Runtime MUST assemble AI context in this order:

1. immutable Orderly security and safety policy;
2. versioned Worker Definition system instructions;
3. granted permissions and validated tool/action schemas;
4. owner-controlled instance instructions within publisher-defined limits;
5. retrieved instance knowledge and connected-Worker results;
6. authorized conversation context;
7. the current user message.

Lower layers MUST NOT override higher layers. Uploaded files, retrieved text, external API responses, chat messages, and connected-Worker output are untrusted data, not system instructions. Model output is also untrusted and MUST pass server-side authorization and schema validation before execution.

## 3. Worker package AI resources

Large prompts MUST be stored as package resources instead of long inline manifest strings. A recommended package layout is:

```text
workers/{publisher}/{slug}/
├── orderly.worker.json
├── prompts/
│   ├── system.md
│   ├── action.schema.json
│   ├── examples.json
│   └── evals.json
├── knowledge/
├── src/
├── workspace/
└── tests/
```

The manifest MAY reference:

```json
{
  "ai": {
    "provider": "platform",
    "prompt_version": "1.0.0",
    "system_prompt_file": "prompts/system.md",
    "action_schema_file": "prompts/action.schema.json",
    "examples_file": "prompts/examples.json"
  }
}
```

All references MUST resolve inside the Worker package. Publication validation MUST reject traversal, missing files, invalid JSON, unsupported schema, excessive resource size, and undeclared executable content. Release synchronization SHOULD persist the resolved resources, hash, package version, and prompt version so running instances are reproducible and rollbackable.

Inline prompt/schema fields remain valid for small Workers and backward compatibility, but package resources are preferred for maintained AI Workers.

## 4. Publisher and admin management

The publisher console SHOULD provide draft and versioned editing for:

- system instructions;
- action/tool input and output schemas;
- bundled knowledge and templates;
- examples and eval cases;
- model/provider constraints;
- requested permissions, connections, events, and risk classifications.

Publishing MUST run validation and evals. A published version MUST be immutable. Changes create a new draft/version and MUST support staged rollout and rollback. Existing instances MUST NOT silently receive a behavior or permission expansion.

Orderly super administrators review, approve, suspend, or revoke packages and enforce platform policy. They SHOULD NOT become the sole authors of contributor prompts. Official Worker prompts may be edited through the same versioned pipeline with stronger review requirements.

## 5. Instance customization

A Worker MAY declare owner-editable instance capabilities:

- `instructions`: behavioral preferences;
- `knowledge`: uploaded reference documents;
- `templates`: invoice, menu, report, or output templates;
- `datasets`: structured domain data;
- `policies`: business rules;
- `assets`: images or supporting files;
- model/provider selection and instance secrets;
- automation and confirmation preferences.

The instance UI MUST distinguish these types. Instance owners do not edit the trusted Worker system prompt directly; they edit a lower-priority instruction layer. A Worker manifest MUST define which fields exist, accepted file types, size/count limits, who may edit them, and which changes require confirmation.

Instance customization MUST NOT grant new permissions, expose Core credentials, bypass validation, disable mandatory confirmation, or access unrelated instances.

## 6. Knowledge processing

Knowledge files SHOULD be parsed, chunked, indexed, and retrieved by relevance. Runtime SHOULD NOT append every uploaded document to every prompt. Each stored item requires instance scope, owner, ACL, content type, source, checksum, version, timestamps, active state, and deletion lifecycle.

Sensitive documents require encryption at rest, malware/content validation, provider disclosure, retention controls, and audit records. Retrieval MUST filter authorization before ranking. Citations SHOULD identify the source Worker/document/object when a response relies on retrieved data.

Fine-tuning MUST NOT be used as storage for changing instance knowledge or private user data. Fine-tuning is optional after prompt, tool, retrieval, and eval quality have been measured with appropriately consented and sanitized examples.

## 7. Generic tool/action contract

AI-enabled Workers SHOULD produce structured actions with stable identifiers, for example:

```json
{
  "action": "invoice.create_draft",
  "arguments": { "customer_id": "..." },
  "confidence": 0.93,
  "reason": "User requested a draft",
  "reply": "Draft invoice is ready."
}
```

Each action declaration requires input/output schema, permission requirements, risk class, idempotency policy, timeout, and handler. Core validates the envelope; the Worker handler validates domain rules. IDs selected by AI MUST be drawn from authorized context or capability results. Unknown or ambiguous identifiers MUST NOT silently fall back to a destructive or materially different target.

Recommended risk classes:

- `read`;
- `write_low_risk`;
- `write_sensitive`;
- `financial`;
- `physical`;
- `irreversible`.

Confirmation policy is enforced outside the model. Sending an invoice, taking payment, opening a parking gate, controlling an IoT device, cancelling a booking, and irreversible deletion require policies appropriate to their risk.

## 8. Worker-to-Worker capability connections

A connection is not unrestricted access and not merely permission to send arbitrary chat text. A Worker Definition declares typed ports:

```json
{
  "connections": {
    "provides": [
      { "capability": "notes.search", "input_schema": "...", "output_schema": "...", "risk": "read" }
    ],
    "consumes": [
      { "capability": "finance.summary", "optional": true }
    ]
  }
}
```

A connection grant binds source instance, target instance, capability, role/scope, grantor, status, expiry, and revocation state. It is explicit, least-privilege, non-transitive by default, and audited. Target storage remains owned by the target Worker; callers use its capability service rather than receiving database access.

Example:

```text
#finance.user --notes.search/read--> #notes.user
```

If Notes contains “Kurangi rokok bulan ini”, Finance may request relevant goal notes after the owner grants read access, combine the result with authorized financial data, and cite the Notes source in its recommendation. Finance MUST NOT receive every note automatically or gain write/delete access unless separately granted.

## 9. Events and proactive collaboration

Workers MAY publish and subscribe to versioned events such as:

- `notes.note.created`;
- `finance.transaction.created`;
- `parking.vehicle.entered`;
- `coworking.booking.created`;
- `iot.sensor.threshold_exceeded`.

Event subscriptions require an explicit connection/capability grant. Events SHOULD carry minimal metadata and object references; consumers retrieve details through authorized capabilities. Delivery MUST support event IDs, idempotency, retries, ordering policy, revocation, and audit. A notification or suggestion does not itself authorize a follow-up mutation.

## 10. Conversation and memory

Conversation context MUST be bounded, target-instance-scoped, role-aware, and intentionally selected. Short recent Assistant history may resolve references such as “that folder” while durable facts belong in Worker storage or knowledge, not hidden chat memory. The execution envelope retains the authenticated actor even when multiple users can access the same target instance. A non-Assistant Worker does not own a separate thread.

Workers SHOULD explicitly decide which facts become durable data. They MUST NOT silently convert every conversation into knowledge or send unrelated history to an AI provider.

Assistant-level knowledge and target-instance knowledge MUST remain distinct. Connecting an instance registers discoverable typed capabilities; it does not merge that instance's documents, database, or prompt into Assistant memory.

## 11. Domain examples

- **Notes:** folders, notes, semantic folder resolution, read/search capabilities.
- **Invoice:** customer lookup, draft/create/send/payment actions with financial confirmation.
- **Menu:** catalog knowledge, availability, price rules, and order handoff.
- **Parking:** space state, vehicle events, reservation, and physical gate controls.
- **Coworking:** rooms, capacity, schedules, booking, cancellation policy, and realtime occupancy.
- **IoT:** device registry, telemetry streams, bounded commands, safety interlocks, and offline behavior.

The domains differ, but all use the same package, action, permission, event, knowledge, connection, confirmation, and audit primitives. Core MUST NOT add permanent `if worker_slug == ...` business branches as the end state.

## 12. Notes vertical-slice implementation

Notes is the reference Worker used to prove this contract. Its prompt, action schema, examples, evals, assets, and action planner live in the package. The generic package dispatcher executes `onAction` in a separate permission-limited Node process. The package returns a versioned capability envelope; Core validates the action against the manifest schema, validates logical resources, permissions, operation limits, and output references, then executes through the trusted capability host. Notes action branches have been removed from `Orderly.Workers.Gateway`.

The current local process runtime is restricted to an explicit trusted-publisher allowlist (initially Orderly). It clears the child environment and limits filesystem reads to the package, SDK, runner, and one-shot request. Arbitrary contributor code MUST remain rejected until the isolated container/WASM runtime also enforces network, process, syscall, CPU, and memory boundaries.

The current storage capability host still maps the proven logical `folders` and `notes` models to existing PostgreSQL contexts. This is a temporary vertical-slice adapter, not permission for package code to access Core storage. The next extraction is manifest-provisioned generic storage so new logical models do not require new Core clauses.

Notes acceptance includes:

- natural-language intent with recent authorized context;
- folder selection by validated ID;
- explicit, inferred, and default folder resolution;
- deterministic normalization at the storage boundary;
- clarification for ambiguous targets;
- role enforcement outside AI;
- prompt/version synchronization in development and release;
- contract tests and eval cases;
- no authoritative Notes state in browser localStorage.

## 13. Implementation sequence

1. Complete Notes prompt resources, context, ID validation, normalization, and evals.
2. **Implemented for Notes:** generic versioned action envelope, package-resource loader, permission-limited Node runner, dispatcher validation, and capability host.
3. **Implemented for Notes:** action planning extracted from the Core-specific Gateway into package `onAction`; PostgreSQL logical model adaptation remains transitional.
4. Replace Notes logical resource clauses with manifest-provisioned generic storage.
5. Add typed `provides`/`consumes` connection grants.
6. Add versioned instance instructions and knowledge storage/retrieval.
7. Add publisher/admin draft, validation, eval, publish, rollout, and rollback UI.
8. Validate the contract with one transactional Worker and one event/physical Worker before declaring it universal.
