import { describe, expect, it, beforeEach, vi } from "vitest"
import * as vscode from "vscode"
import { Anthropic } from "@anthropic-ai/sdk"

import { API } from "../api"
import { buildConversationMarkdown } from "../../shared/markdown/conversation"
import { ClineProvider } from "../../core/webview/ClineProvider"

vi.mock("vscode")
vi.mock("../../core/webview/ClineProvider")

describe("API - getTaskMarkdown", () => {
        let api: API
        let mockProvider: ClineProvider
        const taskId = "task-123"
        const conversationHistory: Anthropic.MessageParam[] = [
                {
                        role: "assistant",
                        content: [
                                {
                                        type: "tool_use",
                                        id: "block-1",
                                        name: "write_file",
                                        input: { path: "file.ts", content: "console.log()" },
                                } as Anthropic.Messages.ToolUseBlockParam,
                        ],
                },
                {
                        role: "user",
                        content: [
                                {
                                        type: "tool_result",
                                        tool_use_id: "block-1",
                                        content: "ok",
                                        is_error: false,
                                } as Anthropic.Messages.ToolResultBlockParam,
                        ],
                },
        ]

        beforeEach(() => {
                const mockOutputChannel = { appendLine: vi.fn() } as unknown as vscode.OutputChannel
                mockProvider = {
                        context: {} as vscode.ExtensionContext,
                        postMessageToWebview: vi.fn(),
                        on: vi.fn(),
                        getCurrentTaskStack: vi.fn().mockReturnValue([]),
                        viewLaunched: true,
                        getTaskWithId: vi.fn().mockResolvedValue({ apiConversationHistory: conversationHistory }),
                } as unknown as ClineProvider

                api = new API(mockOutputChannel, mockProvider)
        })

        it("returns full task markdown", async () => {
                const markdown = await api.getTaskMarkdown(taskId)

                expect(markdown).toBe(buildConversationMarkdown(conversationHistory))
                expect(mockProvider.getTaskWithId).toHaveBeenCalledWith(taskId)
        })

        it("returns markdown for a specific block", async () => {
                const markdown = await api.getTaskMarkdown(taskId, { blockId: "block-1" })

                expect(markdown).toBe(buildConversationMarkdown(conversationHistory, { blockId: "block-1" }))
        })
})
