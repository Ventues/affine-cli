# AFFiNE CLI Skill

Use `affine-cli` via execute_bash for all AFFiNE operations. This replaces the AFFiNE MCP server — same tools, zero schema overhead at startup.

## When to Use

- Reading, writing, or searching AFFiNE docs
- Publishing docs for Founder review
- Creating design docs, research docs, or briefings
- Managing comments on docs
- Any AFFiNE operation

## Syntax

```bash
affine-cli <tool_name> '<json_args>'
```

## ⚠️ Tool Name Reference (verified against affine-mcp)

The tool names below are the ACTUAL names. Do not guess — use this list.

| What you want to do | Correct tool name |
|---|---|
| Read doc as markdown | `export_doc_markdown` |
| Replace entire doc body | `replace_doc_with_markdown` |
| Append markdown to doc | `append_markdown` |
| Find and replace text | `find_and_replace` |
| Search docs | `search_docs` |
| List folder/workspace tree | `list_workspace_tree` |
| Move doc to folder | `move_doc` |
| Create comment | `create_comment` |
| Reply to comment | `create_comment` (no separate reply tool) |

**Common wrong names (do NOT use):**
- ~~`read_doc_as_markdown`~~ → use `export_doc_markdown`
- ~~`write_doc_from_markdown`~~ → use `replace_doc_with_markdown`
- ~~`update_doc_markdown`~~ → use `find_and_replace`
- ~~`list_folder_tree`~~ → use `list_workspace_tree`
- ~~`add_doc_to_folder`~~ → use `move_doc`
- ~~`reply_to_comment`~~ → use `create_comment`

## Common Operations

### Search docs
```bash
# 'query' is required (NOT 'keyword')
affine-cli search_docs '{"query":"design doc"}'
```

### Read doc as markdown
```bash
# Full content
affine-cli export_doc_markdown '{"docId":"abc123"}'

# Returns JSON: {"docId":"...","title":"...","markdown":"..."}
# Extract markdown: ... | python3 -c "import sys,json; print(json.load(sys.stdin)['markdown'])"
```

Note: no headingsOnly or blockOffset support. For large docs, read the full markdown and grep for the section you need.

### Create a new doc
```bash
affine-cli create_doc '{"title":"[AgentDeck] My Design Doc"}'
# Returns: {"docId":"xxx","title":"..."} — extract docId for subsequent operations.
```

### Replace entire doc body with markdown
```bash
# Inline content
affine-cli replace_doc_with_markdown '{"docId":"abc123","markdown":"# Heading\n\nContent here."}'

# From a file (recommended for large docs — avoids shell quoting issues)
CONTENT=$(cat /path/to/content.md)
affine-cli replace_doc_with_markdown "{\"docId\":\"abc123\",\"markdown\":$(python3 -c "import sys,json; print(json.dumps(open('/path/to/content.md').read()))")}"
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

## Workflow: Create and Publish a Design Doc

```bash
# 1. Find the target folder
affine-cli list_workspace_tree '{}'

# 2. Create the doc
RESULT=$(affine-cli create_doc '{"title":"[AgentDeck] My Feature — Design Spec"}')
DOC_ID=$(echo "$RESULT" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['docId'])")

# 3. Write content
affine-cli replace_doc_with_markdown "{\"docId\":\"$DOC_ID\",\"markdown\":\"# My Feature\n\n## Objective\n\nContent...\"}"

# 4. Move to folder
affine-cli move_doc "{\"docId\":\"$DOC_ID\",\"toParentDocId\":\"folder-doc-id\"}"

# 5. Publish
affine-cli publish_doc "{\"docId\":\"$DOC_ID\"}"

# 6. Post link to channel
echo "https://affine.workisboring.com/workspace/796627b0-76b9-4f20-8741-aa018f9327be/$DOC_ID"
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

## Notes

- Workspace ID defaults to DD workspace (796627b0) via ~/.kiro/affine-env
- Always use affine.workisboring.com links when sharing with the Founder
- `export_doc_markdown` returns JSON — always parse it, don't treat output as raw markdown
- `find_and_replace` field is `search` (not `find`, not `old_markdown`)
- For large doc rewrites, use `replace_doc_with_markdown` — it replaces the entire body
- For targeted edits, use `find_and_replace` with `dryRun:true` first to verify the match
