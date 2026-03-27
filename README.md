# affine-cli

Standalone CLI for AFFiNE. No external dependencies — the server is bundled in `server/`.

## Requirements

- Node.js 18+
- Python 3 (standard library only)

That's it. No npm install needed.

## Install

```bash
git clone https://github.com/Ventues/affine-cli
cd affine-cli
cp affine-cli /usr/local/bin/affine-cli   # or any directory in PATH
chmod +x /usr/local/bin/affine-cli
```

## Configure

Create `~/.kiro/affine-env`:

```bash
export AFFINE_BASE_URL=https://your-affine-instance.com
export AFFINE_API_TOKEN=your-token-here
export AFFINE_WORKSPACE_ID=your-workspace-id
```

Or pass env vars directly:

```bash
AFFINE_BASE_URL=https://... AFFINE_API_TOKEN=... affine-cli list_folder_tree '{}'
```

## Usage

```bash
affine-cli <tool_name> '<json_args>'
```

### Examples

```bash
# List folder tree
affine-cli list_folder_tree '{}'

# Search docs
affine-cli search_docs '{"keyword":"design doc"}'

# Read doc (headings only)
affine-cli read_doc_as_markdown '{"docId":"abc123","headingsOnly":true}'

# Read full doc
affine-cli read_doc_as_markdown '{"docId":"abc123"}'

# Create doc
affine-cli create_doc '{"title":"My Doc"}'

# Write doc from inline markdown
affine-cli write_doc_from_markdown '{"docId":"abc123","markdown":"# Hello\n\nContent."}'

# Write doc from file (recommended for large docs)
affine-cli write_doc_from_markdown '{"docId":"abc123"}' --file /path/to/content.md

# Publish doc
affine-cli publish_doc '{"docId":"abc123"}'

# Add to folder
affine-cli add_doc_to_folder '{"docId":"abc123","folderId":"folder-id"}'
```

## Docker / Container

```dockerfile
FROM node:20-slim

# Install Python 3
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

# Copy affine-cli
COPY affine-cli /usr/local/bin/affine-cli
COPY server/ /usr/local/lib/affine-cli/server/

# Fix server path (script resolves relative to itself)
RUN sed -i 's|SCRIPT_DIR=.*|SCRIPT_DIR=/usr/local/lib/affine-cli|' /usr/local/bin/affine-cli
RUN chmod +x /usr/local/bin/affine-cli
```

Pass credentials as env vars:

```bash
docker run -e AFFINE_BASE_URL=... -e AFFINE_API_TOKEN=... myimage affine-cli list_folder_tree '{}'
```

## Available Tools

62 tools covering: docs, folders, comments, history, workspaces, access tokens, and more.

Run `affine-cli tools/list '{}'` to see all available tools (requires a valid connection).

## Credential File Format

`~/.kiro/affine-env`:

```bash
export AFFINE_BASE_URL=https://your-affine-instance.com
export AFFINE_API_TOKEN=your-api-token
export AFFINE_WORKSPACE_ID=your-workspace-id
```

See `affine-env.example` for a template.
