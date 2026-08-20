# Example Worker

Replace the manifest identity, implement focused domain behavior in `src/index.js`, and keep tests beside the handler.

Set `instance.default_name` to a stable, route-safe name. Orderly Core combines it with the owner's username as `@{instance-name}.{owner-username}` and exposes the instance at `/@{instance-name}.{owner-username}`. Core permits each user to own at most one instance of the same Worker Definition; shared Editor or Guest access remains a membership. Use the runtime-provided instance UUID for storage and authorization instead of parsing the public name.
