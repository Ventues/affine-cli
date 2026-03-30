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
| Search docs in workspace | `search_docs` |
| Search blocks within a doc | `search_doc_blocks` |
| List docs in workspace | `list_docs` |
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

### Setup token (new account bootstrap)
```bash
# Sign in with email+password, generate an API token
affine-cli setup_token '{"email":"user@example.com","password":"...","name":"my-token"}'

# Same, but also write the token to ~/.affine-env
affine-cli setup_token '{"email":"user@example.com","password":"...","writeEnv":true}'

# baseUrl defaults to AFFINE_BASE_URL env var; override with:
affine-cli setup_token '{"baseUrl":"https://affine.example.com","email":"...","password":"..."}'
```

### Search docs
```bash
# 'query' is required (NOT 'keyword')
affine-cli search_docs '{"query":"design doc"}'
```

### Read doc as markdown
```bash
# Full content
affine-cli read_doc_as_markdown '{"docId":"abc123"}'

# Returns JSON: {"docId":"...","title":"...","markdown":"..."}
# Extract markdown: ... | python3 -c "import sys,json; print(json.load(sys.stdin)['markdown'])"
```

Note: no headingsOnly or blockOffset support. For large docs, read the full markdown and grep for the section you need.

### Create a new doc
```bash
affine-cli create_doc '{"title":"My Design Doc"}'
# Returns: {"docId":"xxx","title":"..."} — extract docId for subsequent operations.
```

### Replace entire doc body with markdown
```bash
# Inline content
affine-cli write_doc_from_markdown '{"docId":"abc123","markdown":"# Heading\n\nContent here."}'

# From a file (recommended for large docs — avoids shell quoting issues)
affine-cli write_doc_from_markdown "{\"docId\":\"abc123\",\"markdown\":$(python3 -c "import sys,json; print(json.dumps(open('/path/to/content.md').read()))")}"
```

### Append markdown to a doc
```bash
affine-cli append_markdown '{"docId":"abc123","markdown":"## New Section\n\nContent."}'
```

### Update a section (find and replace)
```bash
# 'search' and 'replace' are the field names (NOT 'find'/'old_markdown'/'new_markdown')
affine-cli find_and_replace '{"docId":"abc123","search":"old text","replace":"new text"}'

# Dry run first to verify match
affine-cli find_and_replace '{"docId":"abc123","search":"old text","replace":"new text","dryRun":true}'
```

### Publish a doc (makes it public)
```bash
affine-cli publish_doc '{"docId":"abc123"}'
```

### Revoke public access
```bash
affine-cli revoke_doc '{"docId":"abc123"}'
```

### List workspace tree (folders and docs)
```bash
affine-cli list_workspace_tree '{}'
# Optional: '{"depth":2}' to limit depth
```

### Move doc to a folder
```bash
# toParentDocId is the folder's docId
affine-cli move_doc '{"docId":"abc123","toParentDocId":"folder-doc-id"}'
```

### Create a comment on a doc
```bash
affine-cli create_comment '{"docId":"abc123","content":"My comment"}'
```

### List comments
```bash
affine-cli list_comments '{"docId":"abc123"}'
```

### Reply to a comment
```bash
affine-cli reply_to_comment '{"commentId":"comment-uuid","content":"My reply"}'
```

### Resolve a comment
```bash
affine-cli resolve_comment '{"id":"comment-uuid","resolved":true}'
```

### Delete a doc
```bash
affine-cli delete_doc '{"docId":"abc123"}'
```

### List doc history (timestamps for recovery)
```bash
affine-cli list_histories '{"guid":"abc123"}'
```

### Generate an access token
```bash
affine-cli generate_access_token '{"name":"my-token"}'
```

### List access tokens
```bash
affine-cli list_access_tokens '{}'
```

### Revoke an access token
```bash
affine-cli revoke_access_token '{"id":"token-uuid"}'
```

## Workflow: Create and Publish a Doc

```bash
# 1. Find the target folder
affine-cli list_workspace_tree '{}'

# 2. Create the doc
RESULT=$(affine-cli create_doc '{"title":"My Feature — Design Spec"}')
DOC_ID=$(echo "$RESULT" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['docId'])")

# 3. Write content
affine-cli write_doc_from_markdown "{\"docId\":\"$DOC_ID\",\"markdown\":\"# My Feature\n\n## Objective\n\nContent...\"}"

# 4. Move to folder
affine-cli move_doc "{\"docId\":\"$DOC_ID\",\"toParentDocId\":\"folder-doc-id\"}"

# 5. Publish
affine-cli publish_doc "{\"docId\":\"$DOC_ID\"}"
```

### List attachments in a doc
```bash
affine-cli download_attachment '{"docId":"abc123"}'
# Returns: {"docId":"...","attachments":[{"blockId":"...","name":"file.pdf","sourceId":"...","type":"application/pdf","size":12345}]}
```

### Download an attachment to local file
```bash
# Download first attachment
affine-cli download_attachment '{"docId":"abc123","outputPath":"/tmp/file.pdf"}'

# Download specific attachment by name
affine-cli download_attachment '{"docId":"abc123","name":"report.pdf","outputPath":"/tmp/report.pdf"}'
```

## Discovering Tools & Parameters

```bash
# List all available tools
affine-cli help

# Show parameters and types for a specific tool
affine-cli help <tool_name>

# Fuzzy match — suggests tools if name is wrong
affine-cli help doc
# → "Did you mean: create_doc, list_docs, search_docs, ..."
```

Use `affine-cli help <tool_name>` when unsure about parameter names — it queries the live schema from the bundled server.

## Notes

- Configure your workspace ID in `~/.affine-env` (see repo README)
- **⚠️ Silent namespace mismatch risk:** Writing to the wrong workspace succeeds silently — the doc is created, no error is thrown, but the Founder can't find it. Always verify `AFFINE_WORKSPACE_ID` matches the expected workspace (DD: `796627b0`, A5: `2f5e4d55`) before any write operation. If a doc you just created is "not found" by another agent, check the workspace ID first.
- `read_doc_as_markdown` returns JSON — always parse it, don't treat output as raw markdown
- `find_and_replace` field is `search` (not `find`, not `old_markdown`)
- For large doc rewrites, use `write_doc_from_markdown` — it replaces the entire body
- For targeted edits, use `find_and_replace` with `dryRun:true` first to verify the match
