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
cp affine-cli /usr/local/bin/affine-cli
cp -r server/ /usr/local/lib/affine-cli-server/
chmod +x /usr/local/bin/affine-cli
```

> **Note:** Keep `affine-cli` and `server/` together — the script resolves the server path relative to itself. If you copy just the script, update the `SCRIPT_DIR` line at the top to point to wherever you placed `server/`.

## Configure

Create `~/.kiro/affine-env` (see `affine-env.example`):

```bash
export AFFINE_BASE_URL=https://your-affine-instance.com
export AFFINE_API_TOKEN=your-token-here
export AFFINE_WORKSPACE_ID=your-workspace-id
```

Or pass env vars directly:

```bash
AFFINE_BASE_URL=https://... AFFINE_API_TOKEN=... affine-cli list_workspace_tree '{}'
```

## Usage

```bash
affine-cli <tool_name> '<json_args>'
```

### Examples

```bash
# List workspace tree
affine-cli list_workspace_tree '{}'

# Search docs
affine-cli search_docs '{"keyword":"design doc"}'

# Read doc as markdown
affine-cli export_doc_markdown '{"docId":"abc123"}'

# Create doc
affine-cli create_doc '{"title":"My Doc"}'

# Replace entire doc body
affine-cli replace_doc_with_markdown '{"docId":"abc123","markdown":"# Hello\n\nContent."}'

# Find and replace text in a doc
affine-cli find_and_replace '{"docId":"abc123","search":"old text","replace":"new text"}'

# Move doc to a folder
affine-cli move_doc '{"docId":"abc123","toParentDocId":"folder-id"}'

# Publish doc (make public)
affine-cli publish_doc '{"docId":"abc123"}'
```

See `SKILL.md` for the full tool reference with all 62 tools.

## Docker / Container

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*
COPY affine-cli server/ /usr/local/bin/affine-cli-bundle/
RUN ln -s /usr/local/bin/affine-cli-bundle/affine-cli /usr/local/bin/affine-cli
RUN chmod +x /usr/local/bin/affine-cli-bundle/affine-cli
```

Pass credentials as env vars:

```bash
docker run -e AFFINE_BASE_URL=... -e AFFINE_API_TOKEN=... myimage affine-cli list_workspace_tree '{}'
```

## Credential File

`~/.kiro/affine-env` (see `affine-env.example` for template):

```bash
export AFFINE_BASE_URL=https://your-affine-instance.com
export AFFINE_API_TOKEN=your-api-token
export AFFINE_WORKSPACE_ID=your-workspace-id
```

## Skill / AI Agent Usage

`SKILL.md` in this repo is a ready-to-use skill doc for AI agents (Kiro, Claude, etc.). Copy it into your agent's skill directory and it will know how to use every tool correctly — including common wrong names to avoid.
