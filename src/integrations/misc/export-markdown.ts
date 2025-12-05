import { Anthropic } from "@anthropic-ai/sdk"
import os from "os"
import * as path from "path"
import * as vscode from "vscode"

import { buildConversationMarkdown } from "../../shared/markdown/conversation"

export async function downloadTask(dateTs: number, conversationHistory: Anthropic.MessageParam[]) {
	// File name
	const date = new Date(dateTs)
	const month = date.toLocaleString("en-US", { month: "short" }).toLowerCase()
	const day = date.getDate()
	const year = date.getFullYear()
	let hours = date.getHours()
	const minutes = date.getMinutes().toString().padStart(2, "0")
        const seconds = date.getSeconds().toString().padStart(2, "0")
        const ampm = hours >= 12 ? "pm" : "am"
        hours = hours % 12
        hours = hours ? hours : 12 // the hour '0' should be '12'
        const fileName = `roo_task_${month}-${day}-${year}_${hours}-${minutes}-${seconds}-${ampm}.md`

        // Generate markdown
        const markdownContent = buildConversationMarkdown(conversationHistory)

	// Prompt user for save location
	const saveUri = await vscode.window.showSaveDialog({
		filters: { Markdown: ["md"] },
		defaultUri: vscode.Uri.file(path.join(os.homedir(), "Downloads", fileName)),
	})

	if (saveUri) {
		// Write content to the selected location
		await vscode.workspace.fs.writeFile(saveUri, Buffer.from(markdownContent))
		vscode.window.showTextDocument(saveUri, { preview: true })
	}
}

export function findToolName(toolCallId: string, messages: Anthropic.MessageParam[]): string {
        for (const message of messages) {
                if (Array.isArray(message.content)) {
			for (const block of message.content) {
				if (block.type === "tool_use" && block.id === toolCallId) {
					return block.name
				}
			}
		}
	}
	return "Unknown Tool"
}
