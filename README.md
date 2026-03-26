# affine-cli

A lightweight CLI wrapper for [affine-mcp-server](https://www.npmjs.com/package/affine-mcp-server) that lets AI agents call AFFiNE tools from shell scripts without loading the full MCP schema into context.

**Why:** The AFFiNE MCP server loads ~30K tokens of schema at startup. For agents that only need to call a few tools per session, this is wasteful. `affine-cli` sends a single one-shot JSON-RPC call and exits — no persistent process, no schema overhead.

## Requirements

- Node.js 18+
- `affine-mcp-server` installed globally: `npm install -g affine-mcp-server`
- Python 3 (for the JSON-RPC wrapper)

## Install

```bash
# 1. Install the MCP server
npm install -g affine-mcp-server

# 2. Copy affine-cli to your PATH
cp affine-cli /usr/local/bin/affine-cli
chmod +x /usr/local/bin/affine-cli

# 3. Create your env file
cp affine-env.example ~/.kiro/affine-env
# Edit ~/.kiro/affine-env with your AFFiNE credentials
```

## Configuration

Create `~/.kiro/affine-env` (never commit this file):

```bash
export AFFINE_BASE_URL=https://your-affine-instance.com
export AFFINE_API_TOKEN=your_api_token_here
export AFFINE_WORKSPACE_ID=your_workspace_id_here
export AFFINE_LOGIN_AT_START=false
```

You can also set these as environment variables directly — `affine-cli` only reads the file if `AFFINE_BASE_URL` is not already set.

## Usage

```bash
affine-cli <tool_name> '<json_args>'
```

### Examples

```bash
# Search docs
affine-cli search_docs '{"keyword":"design doc"}'

# Read doc (headings only — fast for large docs)
affine-cli read_doc_as_markdown '{"docId":"abc123","headingsOnly":true}'

# Read full doc
affine-cli read_doc_as_markdown '{"docId":"abc123"}'

# Read a section (use blockOffset/blockLimit from headingsOnly)
affine-cli read_doc_as_markdown '{"docId":"abc123","blockOffset":5,"blockLimit":10}'

# Create a doc
affine-cli create_doc '{"title":"My Doc"}'

# Write content to a doc (inline)
affine-cli write_doc_from_markdown '{"docId":"abc123","markdown":"# Hello\n\nContent here."}'

# Write content from a file (recommended for large docs)
affine-cli write_doc_from_markdown '{"docId":"abc123"}' --file /path/to/content.md

# Update a section (str_replace style)
affine-cli update_doc_markdown '{"docId":"abc123","old_markdown":"old text","new_markdown":"new text"}'

# List folder tree
affine-cli list_folder_tree '{}'

# Add doc to folder
affine-cli add_doc_to_folder '{"docId":"abc123","folderId":"folder-id"}'

# Publish a doc (make public)
affine-cli publish_doc '{"docId":"abc123"}'

# List comments
affine-cli list_comments '{"docId":"abc123"}'

# Resolve a comment
affine-cli resolve_comment '{"id":"comment-uuid","resolved":true}'
```

All tool names and arguments match the `affine-mcp-server` MCP tools exactly.

## Using with AI Agents (Kiro skill)

Copy `SKILL.md` to your agent's skills directory:

```bash
cp SKILL.md ~/.kiro/skills/core/affine-cli/SKILL.md
```

The skill teaches the agent to use `affine-cli` via `execute_bash` instead of loading the AFFiNE MCP server. See `SKILL.md` for the full workflow including how to create and publish design docs.

## Docker / Container Agents

For agents running inside Docker containers, install `affine-mcp-server` in the image and set the env vars at container startup. The `affine-cli` script works identically inside containers — no host access needed.

```dockerfile
RUN npm install -g affine-mcp-server
COPY affine-cli /usr/local/bin/affine-cli
RUN chmod +x /usr/local/bin/affine-cli
```

Pass credentials via environment variables (not the file):

```bash
docker run -e AFFINE_BASE_URL=... -e AFFINE_API_TOKEN=... -e AFFINE_WORKSPACE_ID=... your-image
```

## License

MIT
