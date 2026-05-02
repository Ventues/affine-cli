# affine-cli

Standalone CLI for AFFiNE. Wraps the AFFiNE MCP server as a one-shot bash tool.

## Requirements

- Node.js 18+
- Python 3 (standard library only)

## Install

```bash
git clone https://github.com/Ventues/affine-cli
cd affine-cli
npm install
npm run build
```

Then symlink or copy:

```bash
ln -s $(pwd)/affine-cli /usr/local/bin/affine-cli
```

> The bash wrapper resolves `dist/index.js` relative to itself. Keep the repo intact or update paths if you relocate.

## Configure

Create `~/.affine-env`:

```bash
export AFFINE_BASE_URL=https://your-affine-instance.com
export AFFINE_API_TOKEN=your-token-here
export AFFINE_WORKSPACE_ID=your-workspace-id  # optional — used as a hint, not a hard scope
```

Or pass env vars directly:

```bash
AFFINE_BASE_URL=https://... AFFINE_API_TOKEN=... affine-cli list_docs '{}'
```

## Cross-Workspace Behavior

When `workspaceId` is omitted, tools automatically operate across **all accessible workspaces**:

- `search_docs` — searches all workspaces in parallel, results include `workspaceId`
- `list_docs` — lists docs from all workspaces, each result tagged with `workspaceId`
- `get_doc` — tries `AFFINE_WORKSPACE_ID` first (hint), falls back to other workspaces if not found
- `read_doc` / `read_doc_as_markdown` — same fallback behavior as `get_doc`

When `workspaceId` is provided, tools scope to that workspace only.

`AFFINE_WORKSPACE_ID` is a **hint** (try first for faster lookups), not a hard requirement.

## Usage

```bash
affine-cli <tool_name> '<json_args>'
```

### Examples

```bash
# Search across all workspaces
affine-cli search_docs '{"keyword":"design doc"}'

# List all docs across all workspaces
affine-cli list_docs '{}'

# List docs in a specific workspace
affine-cli list_docs '{"workspaceId":"796627b0-..."}'

# Get doc metadata (auto-finds correct workspace)
affine-cli get_doc '{"docId":"abc123"}'

# Read doc as markdown (auto-finds correct workspace)
affine-cli read_doc_as_markdown '{"docId":"abc123"}'

# Create doc
affine-cli create_doc '{"title":"My Doc"}'

# Replace entire doc body
affine-cli write_doc_from_markdown '{"docId":"abc123","markdown":"# Hello\n\nContent."}'

# Partial replace by block IDs (preserves rest of doc)
affine-cli write_doc_from_markdown '{"docId":"abc123","blockIds":["uuid1","uuid2"],"markdown":"## Replacement"}'

# Partial replace by block range
affine-cli write_doc_from_markdown '{"docId":"abc123","blockOffset":5,"blockLimit":3,"markdown":"..."}'

# String-level find and replace
affine-cli update_doc_markdown '{"docId":"abc123","oldText":"old text","newText":"new text"}'

# Move doc to a folder
affine-cli add_doc_to_folder '{"docId":"abc123","folderId":"folder-id"}'

# List all available tools
affine-cli help
```

## Development

```bash
# Build TypeScript → dist/
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

### Project Structure

```
affine-cli          # Bash wrapper (calls dist/index.js via MCP JSON-RPC)
src/
  index.ts          # Server entry point
  config.ts         # Environment/config loading
  graphqlClient.ts  # GraphQL client (with curl fallback for network issues)
  ws.ts             # WebSocket client for CRDT operations
  auth.ts           # Authentication helpers
  types.ts          # Shared types
  tools/
    docs.ts         # Document CRUD, search, read/write markdown (3.5K lines)
    workspaces.ts   # Workspace listing and management
    canvas.ts       # Edgeless canvas operations
    comments.ts     # Document comments
    organize.ts     # Folders and organization tree
    kanban.ts       # Kanban board operations
    blobStorage.ts  # File/blob storage
    history.ts      # Document version history
    moveDocs.ts     # Document relocation
    notifications.ts
    accessTokens.ts
    user.ts / userCRUD.ts / auth.ts
  util/
    blocks.ts       # CRDT block parsing utilities
    mcp.ts          # MCP helpers
```

### Network Fallback

The GraphQL client tries `undici` fetch first. If it fails with `EHOSTUNREACH` (common with VPN network extensions blocking Node.js TCP), it automatically falls back to `curl`. This is transparent — no configuration needed.

## Docker

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y python3 curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/ src/
COPY tsconfig.json affine-cli ./
RUN npm run build && chmod +x affine-cli
ENV PATH="/app:$PATH"
```

## AI Agent Usage

`SKILL.md` in this repo is a ready-to-use skill doc for AI agents. Copy it into your agent's skill directory and it will know how to use every tool correctly.
