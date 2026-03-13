#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SIGNBEE_API_URL =
  process.env.SIGNBEE_API_URL || "https://www.signb.ee";
const SIGNBEE_API_KEY = process.env.SIGNBEE_API_KEY || "";

const server = new McpServer({
  name: "signbee",
  version: "1.0.0",
});

// --- Tool: send_document ---
server.tool(
  "send_document",
  "Send a document for two-party e-signing. Converts markdown to PDF, verifies the sender, emails the recipient a signing link, and delivers a SHA-256 certified signed copy to both parties.",
  {
    markdown: z
      .string()
      .min(10)
      .describe(
        "Document content in markdown format. This will be converted to a professional PDF."
      ),
    title: z
      .string()
      .optional()
      .describe(
        "Document title. If omitted, extracted from the first markdown heading."
      ),
    sender_name: z.string().describe("Full name of the document sender"),
    sender_email: z
      .string()
      .email()
      .describe("Email address of the sender"),
    recipient_name: z
      .string()
      .describe("Full name of the document recipient"),
    recipient_email: z
      .string()
      .email()
      .describe("Email address of the recipient"),
    expires_in_days: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe(
        "Days until the signing link expires. Default: 7"
      ),
  },
  async (params) => {
    try {
      const body: Record<string, unknown> = {
        markdown: params.markdown,
        sender_name: params.sender_name,
        sender_email: params.sender_email,
        recipient_name: params.recipient_name,
        recipient_email: params.recipient_email,
      };

      if (params.title) body.title = params.title;
      if (params.expires_in_days) body.expires_in_days = params.expires_in_days;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (SIGNBEE_API_KEY) {
        headers["Authorization"] = `Bearer ${SIGNBEE_API_KEY}`;
      }

      const response = await fetch(`${SIGNBEE_API_URL}/api/v1/send`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error (${response.status}): ${JSON.stringify(data)}`,
            },
          ],
          isError: true,
        };
      }

      const status = data.status;
      let summary: string;

      if (status === "pending_recipient") {
        summary = [
          `✅ Document sent successfully!`,
          ``,
          `📄 Document ID: ${data.document_id}`,
          `👤 Sender: ${data.sender} (pre-verified via API key)`,
          `📩 Recipient: ${data.recipient}`,
          `⏰ Expires: ${data.expires_at}`,
          ``,
          `The recipient has been emailed a signing link.`,
        ].join("\n");
      } else if (status === "pending_sender") {
        summary = [
          `📧 Verification required`,
          ``,
          `📄 Document ID: ${data.document_id}`,
          `📩 ${data.message}`,
          ``,
          `The sender must verify their email before the document is sent to the recipient.`,
          ``,
          `💡 Tip: Set the SIGNBEE_API_KEY environment variable to skip sender verification.`,
          `   Get your API key at: https://signb.ee/dashboard`,
        ].join("\n");
      } else {
        summary = JSON.stringify(data, null, 2);
      }

      return {
        content: [{ type: "text" as const, text: summary }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to send document: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Tool: send_document_pdf ---
server.tool(
  "send_document_pdf",
  "Send an existing PDF document for two-party e-signing. Use this when you already have a PDF URL instead of markdown content.",
  {
    pdf_url: z
      .string()
      .url()
      .describe("Publicly accessible URL to the PDF document"),
    title: z.string().describe("Document title"),
    sender_name: z.string().describe("Full name of the document sender"),
    sender_email: z
      .string()
      .email()
      .describe("Email address of the sender"),
    recipient_name: z
      .string()
      .describe("Full name of the document recipient"),
    recipient_email: z
      .string()
      .email()
      .describe("Email address of the recipient"),
    expires_in_days: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe(
        "Days until the signing link expires. Default: 7"
      ),
  },
  async (params) => {
    try {
      const body: Record<string, unknown> = {
        markdown: "See attached PDF",
        pdf_url: params.pdf_url,
        title: params.title,
        sender_name: params.sender_name,
        sender_email: params.sender_email,
        recipient_name: params.recipient_name,
        recipient_email: params.recipient_email,
      };

      if (params.expires_in_days) body.expires_in_days = params.expires_in_days;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (SIGNBEE_API_KEY) {
        headers["Authorization"] = `Bearer ${SIGNBEE_API_KEY}`;
      }

      const response = await fetch(`${SIGNBEE_API_URL}/api/v1/send`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error (${response.status}): ${JSON.stringify(data)}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ PDF document "${params.title}" sent for signing.\n\n📄 Document ID: ${data.document_id}\nStatus: ${data.status}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to send PDF: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
