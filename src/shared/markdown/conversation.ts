import { Anthropic } from "@anthropic-ai/sdk"

// Extended content block types to support new Anthropic API features
export interface ReasoningBlock {
        type: "reasoning"
        text: string
}

export type ExtendedContentBlock = Anthropic.Messages.ContentBlockParam | ReasoningBlock

export type ExtendedMessageParam = Omit<Anthropic.MessageParam, "content"> & {
        content: string | ExtendedContentBlock[]
}

export type ConversationMarkdownOptions = {
        blockId?: string
}

/**
 * Build a markdown transcript from Anthropic conversation history.
 *
 * When a blockId is provided, only the matching content block is rendered
 * (tool_use blocks match on `id`, tool_result blocks match on `tool_use_id`).
 */
export function buildConversationMarkdown(
        conversationHistory: ExtendedMessageParam[],
        options?: ConversationMarkdownOptions,
): string {
        if (options?.blockId) {
                const filteredHistory = filterConversationByBlockId(conversationHistory, options.blockId)
                return buildConversationMarkdown(filteredHistory)
        }

        return conversationHistory
                .map((message) => {
                        const role = message.role === "user" ? "**User:**" : "**Assistant:**"
                        const content = Array.isArray(message.content)
                                ? message.content
                                          .map((block) => formatContentBlockToMarkdown(block as ExtendedContentBlock))
                                          .join("\n")
                                : message.content
                        return `${role}\n\n${content}\n\n`
                })
                .join("---\n\n")
}

export function formatContentBlockToMarkdown(block: ExtendedContentBlock): string {
        switch (block.type) {
                case "text":
                        return block.text
                case "image":
                        return `[Image]`
                case "tool_use": {
                        let input: string
                        if (typeof block.input === "object" && block.input !== null) {
                                input = Object.entries(block.input)
                                        .map(([key, value]) => {
                                                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1)
                                                const formattedValue =
                                                        typeof value === "object" && value !== null
                                                                ? JSON.stringify(value, null, 2)
                                                                : String(value)
                                                return `${formattedKey}: ${formattedValue}`
                                        })
                                        .join("\n")
                        } else {
                                input = String(block.input)
                        }
                        return `[Tool Use: ${block.name}]\n${input}`
                }
                case "tool_result": {
                        const toolName = "Tool"
                        if (typeof block.content === "string") {
                                return `[${toolName}${block.is_error ? " (Error)" : ""}]\n${block.content}`
                        } else if (Array.isArray(block.content)) {
                                return `[${toolName}${block.is_error ? " (Error)" : ""}]\n${block.content
                                        .map((contentBlock) => formatContentBlockToMarkdown(contentBlock))
                                        .join("\n")}`
                        } else {
                                return `[${toolName}${block.is_error ? " (Error)" : ""}]`
                        }
                }
                case "reasoning":
                        return `[Reasoning]\n${block.text}`
                default:
                        return `[Unexpected content type: ${block.type}]`
        }
}

function filterConversationByBlockId(conversationHistory: ExtendedMessageParam[], blockId: string) {
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
                const message = conversationHistory[i]

                if (!Array.isArray(message.content)) continue

                const matchingBlock = message.content.find((block) =>
                        matchesBlockId(block as ExtendedContentBlock, blockId),
                ) as ExtendedContentBlock | undefined

                if (matchingBlock) {
                        return [
                                {
                                        ...message,
                                        content: [matchingBlock],
                                },
                        ]
                }
        }

        throw new Error(`No content block found for id ${blockId}`)
}

function matchesBlockId(block: ExtendedContentBlock, blockId: string) {
        if ("id" in block && block.id === blockId) {
                return true
        }

        if (block.type === "tool_result" && "tool_use_id" in block && block.tool_use_id === blockId) {
                return true
        }

        return false
}
