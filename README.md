# envchain

> CLI tool to manage and chain environment configs across multiple deployment targets

## Installation

```bash
npm install -g envchain
```

## Usage

Define your environment configs in a `envchain.config.ts` file and chain them across targets:

```ts
// envchain.config.ts
export default {
  base: ".env.base",
  targets: {
    staging: [".env.base", ".env.staging"],
    production: [".env.base", ".env.production"],
  },
};
```

Run a command with a resolved environment chain:

```bash
# Load and merge configs for a specific target
envchain run --target staging -- node server.js

# Export merged env to a file
envchain export --target production --out .env.merged

# Validate all targets for missing keys
envchain validate

# List all defined targets
envchain list
```

## Commands

| Command    | Description                              |
|------------|------------------------------------------|
| `run`      | Run a command with a chained environment |
| `export`   | Export merged config to a file           |
| `validate` | Check all targets for missing variables  |
| `list`     | List all configured targets              |

## License

MIT © envchain contributors
