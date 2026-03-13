# Signbee MCP Server

Document signing for AI agents — as an MCP tool.

Send, sign, and verify documents with a single tool call. Works with Claude, Cursor, Windsurf, and any MCP-compatible client.

## Quick Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "signbee": {
      "command": "npx",
      "args": ["-y", "signbee-mcp"],
      "env": {
        "SIGNBEE_API_KEY": "your-api-key-from-signb.ee/dashboard"
      }
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings:

```json
{
  "signbee": {
    "command": "npx",
    "args": ["-y", "signbee-mcp"],
    "env": {
      "SIGNBEE_API_KEY": "your-api-key"
    }
  }
}
```

> **Note:** The API key is optional. Without it, the sender verifies via email OTP. With it, documents are sent instantly.

## Tools

### `send_document`

Send a markdown document for two-party e-signing.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `markdown` | ✅ | Document content in markdown format |
| `sender_name` | ✅ | Full name of the sender |
| `sender_email` | ✅ | Email address of the sender |
| `recipient_name` | ✅ | Full name of the recipient |
| `recipient_email` | ✅ | Email address of the recipient |
| `title` | ❌ | Document title (auto-extracted from heading) |
| `expires_in_days` | ❌ | Days until signing link expires (default: 7) |

**Example prompt:** "Send an NDA to bob@acme.com from alice@company.com"

### `send_document_pdf`

Send an existing PDF for two-party e-signing.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `pdf_url` | ✅ | Publicly accessible URL to the PDF |
| `title` | ✅ | Document title |
| `sender_name` | ✅ | Full name of the sender |
| `sender_email` | ✅ | Email address of the sender |
| `recipient_name` | ✅ | Full name of the recipient |
| `recipient_email` | ✅ | Email address of the recipient |
| `expires_in_days` | ❌ | Days until signing link expires (default: 7) |

## How It Works

1. You ask your AI to send a document for signing
2. The MCP server calls the Signbee API
3. Signbee converts markdown → PDF, handles the signing ceremony
4. Both parties receive a SHA-256 certified signed copy via email

## Get Your API Key

1. Go to [signb.ee](https://signb.ee)
2. Create an account
3. Navigate to the Dashboard
4. Copy your API key

## Links

- **Website:** [signb.ee](https://signb.ee)
- **OpenAPI Spec:** [signb.ee/openapi.json](https://signb.ee/openapi.json)
- **llms.txt:** [signb.ee/llms.txt](https://signb.ee/llms.txt)

## License

MIT
