# AFFiNE CLI Skill

Use `affine-cli` via execute_bash for all AFFiNE operations.

## When to Use

- Reading, writing, or searching AFFiNE docs
- Publishing docs for review
- Creating design docs, research docs, or briefings
- Managing comments on docs
- Any AFFiNE operation

## Syntax

```bash
affine-cli <tool_name> '<json_args>'
```

## Cross-Workspace Behavior

When `workspaceId` is omitted, tools automatically search across **all accessible workspaces**:

- `search_docs` — searches all workspaces in parallel, results include `workspaceId`
- `list_docs` — lists docs from all workspaces, each tagged with `workspaceId`
- `get_doc` — tries default workspace first, falls back to others if not found
- `read_doc` / `read_doc_as_markdown` — same fallback as `get_doc`

When `workspaceId` is provided, tools scope to that workspace only.

## Tool Reference

| What you want to do | Tool name |
|---|---|
| **Auth & Setup** | |
| Bootstrap token from email+password | `setup_token` |
| Upload avatar from local file | `upload_avatar` |
| Get current signed-in user | `current_user` |
| Generate personal access token | `generate_access_token` |
| List access tokens | `list_access_tokens` |
| Revoke access token | `revoke_access_token` |
| **Documents** | |
| Create a new doc | `create_doc` |
| Read doc as markdown | `read_doc_as_markdown` |
| Replace entire doc body | `write_doc_from_markdown` |
| Partial update (str_replace style) | `update_doc_markdown` |
| Rename doc | `update_doc_title` |
| Delete doc | `delete_doc` |
| Search docs (cross-workspace by default) | `search_docs` |
| Search blocks within a doc | `search_doc_blocks` |
| List docs (cross-workspace by default) | `list_docs` |
| Publish doc (make public) | `publish_doc` |
| Revoke public access | `revoke_doc` |
| List doc history | `list_histories` |
| **Folders & Organization** | |
| List full folder tree | `list_folder_tree` |
| List folder children | `list_folder_children` |
| Create folder | `create_folder` |
| Move docs to folder | `move_docs` |
| Add doc link to folder | `add_doc_to_folder` |
| Move folder/doc to parent | `move_to_folder` |
| **Comments** | |
| Create comment on doc | `create_comment` |
| List comments | `list_comments` |
| Reply to comment | `reply_to_comment` |
| Resolve/unresolve comment | `resolve_comment` |
| **Attachments** | |
| Download attachment from doc | `download_attachment` |
| **Block-Level Ops (fallback)** | |
| Append blocks to doc | `append_block` |
| Update a block in-place | `update_block` |
| Delete a block | `delete_block` |
| Move/reorder a block | `move_block` |
| Read doc blocks (WebSocket) | `read_doc` |

## Common Operations

### Search docs
```bash
# Cross-workspace search (default — no workspaceId needed)
affine-cli search_docs '{"keyword":"design doc"}'

# Scoped to a specific workspace
affine-cli search_docs '{"keyword":"design doc","workspaceId":"796627b0-..."}'
```

### List docs
```bash
# All docs across all workspaces
affine-cli list_docs '{}'

# Scoped to one workspace
affine-cli list_docs '{"workspaceId":"796627b0-..."}'
```

### Read doc as markdown
```bash
# Auto-finds the correct workspace
affine-cli read_doc_as_markdown '{"docId":"abc123"}'

# Returns JSON: {"docId":"...","title":"...","markdown":"...","workspaceId":"..."}
# Extract markdown:
# ... | python3 -c "import sys,json; print(json.load(sys.stdin)['markdown'])"
```

### Get doc metadata
```bash
# Auto-finds the correct workspace
affine-cli get_doc '{"docId":"abc123"}'
```

### Create a new doc
```bash
affine-cli create_doc '{"title":"My Design Doc"}'
# Returns: {"docId":"xxx","title":"..."} — extract docId for subsequent operations.
```

### Replace entire doc body with markdown
```bash
# Inline content
affine-cli write_doc_from_markdown '{"docId":"abc123","markdown":"# Heading\n\nContent here."}'

# From a file (recommended for large docs)
affine-cli write_doc_from_markdown '{"docId":"abc123"}' --file /path/to/content.md
```

### Append markdown to a doc
```bash
affine-cli append_markdown '{"docId":"abc123","markdown":"## New Section\n\nContent."}'
```

### Update a section (find and replace)
```bash
affine-cli update_doc_markdown '{"docId":"abc123","oldText":"old text","newText":"new text"}'

# Dry run first to verify match
affine-cli update_doc_markdown '{"docId":"abc123","oldText":"old text","newText":"new text","dryRun":true}'
```

### Publish a doc (makes it public)
```bash
affine-cli publish_doc '{"docId":"abc123"}'
```

### List workspace tree (folders and docs)
```bash
affine-cli list_folder_tree '{}'
```

### Move doc to a folder
```bash
affine-cli add_doc_to_folder '{"docId":"abc123","folderId":"folder-id"}'
```

### Comments
```bash
# Create
affine-cli create_comment '{"docId":"abc123","content":"My comment"}'

# List
affine-cli list_comments '{"docId":"abc123"}'

# Reply
affine-cli reply_to_comment '{"commentId":"comment-uuid","content":"My reply"}'

# Resolve
affine-cli resolve_comment '{"id":"comment-uuid","resolved":true}'
```

## Workflow: Create and Publish a Doc

```bash
# 1. Find the target folder
affine-cli list_folder_tree '{}'

# 2. Create the doc
RESULT=$(affine-cli create_doc '{"title":"My Feature — Design Spec"}')
DOC_ID=$(echo "$RESULT" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['docId'])")

# 3. Write content
affine-cli write_doc_from_markdown "{\"docId\":\"$DOC_ID\",\"markdown\":\"# My Feature\n\n## Objective\n\nContent...\"}"

# 4. Move to folder
affine-cli add_doc_to_folder "{\"docId\":\"$DOC_ID\",\"folderId\":\"folder-id\"}"

# 5. Publish
affine-cli publish_doc "{\"docId\":\"$DOC_ID\"}"
```

## Discovering Tools & Parameters

```bash
# List all available tools
affine-cli help

# Show parameters and types for a specific tool
affine-cli help <tool_name>
```

## Notes

- Configure credentials in `~/.affine-env` (see repo README)
- `AFFINE_WORKSPACE_ID` is a hint (try first), not a hard scope — tools fall back to other workspaces automatically
- `read_doc_as_markdown` returns JSON — always parse it, don't treat output as raw markdown
- For large doc rewrites, use `write_doc_from_markdown` — it replaces the entire body
- For targeted edits, use `update_doc_markdown` with `dryRun:true` first to verify the match
