import { describe, expect, it } from "vitest"
import { Anthropic } from "@anthropic-ai/sdk"

import { buildConversationMarkdown, type ExtendedMessageParam } from "../markdown/conversation"

const conversationHistory: ExtendedMessageParam[] = [
        {
                role: "user",
                content: [
                        {
                                type: "text",
                                text: "Hello there",
                        } as Anthropic.Messages.TextBlockParam,
                ],
        },
        {
                role: "assistant",
                content: [
                        {
                                type: "reasoning",
                                text: "Thinking through the request",
                        },
                        {
                                type: "tool_use",
                                id: "tool-2",
                                name: "format_code",
                                input: "prettier",
                        } as Anthropic.Messages.ToolUseBlockParam,
                        {
                                type: "tool_use",
                                id: "tool-1",
                                name: "run_command",
                                input: { path: "index.ts", force: true },
                        } as Anthropic.Messages.ToolUseBlockParam,
                ],
        },
        {
                role: "user",
                content: [
                        {
                                type: "tool_result",
                                tool_use_id: "tool-1",
                                content: "Command output",
                                is_error: false,
                        } as Anthropic.Messages.ToolResultBlockParam,
                ],
        },
]

describe("conversation markdown helpers", () => {
        it("builds markdown transcript with separators", () => {
                const markdown = buildConversationMarkdown(conversationHistory)

                expect(markdown).toBe(
                        "**User:**\n\n" +
                                "Hello there\n\n" +
                                "---\n\n" +
                                "**Assistant:**\n\n" +
                                "[Reasoning]\nThinking through the request\n[Tool Use: format_code]\nprettier\n" +
                                "[Tool Use: run_command]\nPath: index.ts\nForce: true\n\n" +
                                "---\n\n" +
                                "**User:**\n\n" +
                                "[Tool]\nCommand output\n\n",
                )
        })

        it("builds markdown for a specific tool_use block", () => {
                const markdown = buildConversationMarkdown(conversationHistory, { blockId: "tool-2" })

                expect(markdown).toBe(
                        "**Assistant:**\n\n" +
                                "[Tool Use: format_code]\nprettier\n\n",
                )
        })

        it("builds markdown for a tool_result block", () => {
                const resultMarkdown = buildConversationMarkdown(conversationHistory, { blockId: "tool-1" })

                expect(resultMarkdown).toBe("**User:**\n\n[Tool]\nCommand output\n\n")
        })
})
