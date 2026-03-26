# AFFiNE CLI Skill

Use `affine-cli` via execute_bash for all AFFiNE operations. This replaces the AFFiNE MCP server — same tools, zero schema overhead at startup.

## When to Use

- Reading, writing, or searching AFFiNE docs
- Publishing docs for Founder review
- Creating design docs, research docs, or briefings
- Managing comments on docs
- Any AFFiNE operation (all 62 MCP tools available)

## Syntax

```bash
affine-cli <tool_name> '<json_args>'
```

The tool names and arguments are identical to the AFFiNE MCP server tools. The CLI spawns affine-mcp internally, sends one tool call, returns the result.

## Common Operations

### Search docs
```bash
affine-cli search_docs '{"keyword":"design doc"}'
```

### Read doc as markdown (headings only — do this first for large docs)
```bash
affine-cli read_doc_as_markdown '{"docId":"abc123","headingsOnly":true}'
```

### Read doc as markdown (full content)
```bash
affine-cli read_doc_as_markdown '{"docId":"abc123"}'
```

### Read a specific section (use blockOffset/blockLimit from headingsOnly)
```bash
affine-cli read_doc_as_markdown '{"docId":"abc123","blockOffset":5,"blockLimit":10}'
```

### Create a new doc
```bash
affine-cli create_doc '{"title":"[AgentDeck] My Design Doc"}'
```
Returns: `{"docId":"xxx","title":"..."}` — extract docId for subsequent operations.

### Write markdown to a doc (replaces entire body)
```bash
# Inline content
affine-cli write_doc_from_markdown '{"docId":"abc123","markdown":"# Heading\n\nContent here."}'

# From a file (recommended for large docs — avoids shell quoting issues)
affine-cli write_doc_from_markdown '{"docId":"abc123"}' --file /path/to/content.md
```

### Update a section (str_replace style — must match exactly once)
```bash
affine-cli update_doc_markdown '{"docId":"abc123","old_markdown":"old text","new_markdown":"new text"}'
```

### Publish a doc (makes it public)
```bash
affine-cli publish_doc '{"docId":"abc123"}'
```

### Revoke public access
```bash
affine-cli revoke_doc '{"docId":"abc123"}'
```

### List folder tree
```bash
affine-cli list_folder_tree '{}'
```

### Add doc to a folder
```bash
affine-cli add_doc_to_folder '{"docId":"abc123","folderId":"folder-id"}'
```

### Create a comment on a doc
```bash
affine-cli create_comment '{"docId":"abc123","blockId":"block-id","blockText":"full block text","selectedText":"highlighted text","content":"My comment"}'
```

### List comments
```bash
affine-cli list_comments '{"docId":"abc123"}'
```

### Resolve a comment
```bash
affine-cli resolve_comment '{"id":"comment-uuid","resolved":true}'
```

### Reply to a comment
```bash
affine-cli reply_to_comment '{"commentId":"comment-uuid","content":"My reply"}'
```

### Delete a doc
```bash
affine-cli delete_doc '{"docId":"abc123"}'
```

### List doc history (timestamps for recovery)
```bash
affine-cli list_histories '{"guid":"abc123"}'
```

### Recover doc to a previous version
```bash
affine-cli recover_doc '{"guid":"abc123","timestamp":"2026-03-20T19:36:44.218Z"}'
```
Use a timestamp from `list_histories`. Known issue: may error if timestamp doesn't match exactly.

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
# 1. Find the Design Docs folder
affine-cli list_folder_tree '{}'

# 2. Create the doc
RESULT=$(affine-cli create_doc '{"title":"[AgentDeck] My Feature — Design Spec"}')
DOC_ID=$(echo "$RESULT" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['docId'])")

# 3. Write content
affine-cli write_doc_from_markdown "{\"docId\":\"$DOC_ID\",\"markdown\":\"# My Feature\\n\\n## Objective\\n\\nContent...\"}"

# 4. Add to folder
affine-cli add_doc_to_folder "{\"docId\":\"$DOC_ID\",\"folderId\":\"design-docs-folder-id\"}"

# 5. Publish
affine-cli publish_doc "{\"docId\":\"$DOC_ID\"}"

# 6. Post link to channel
echo "https://affine.workisboring.com/workspace/796627b0-76b9-4f20-8741-aa018f9327be/$DOC_ID"
```

## Notes

- All tool names and args match the AFFiNE MCP server exactly
- Workspace ID defaults to DD workspace (796627b0) via ~/.kiro/affine-env
- Always use affine.workisboring.com links when sharing with the Founder
- For large docs, use headingsOnly first, then read specific sections with blockOffset/blockLimit
- JSON args must be single-quoted in bash to avoid shell expansion issues
