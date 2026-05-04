// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import type { Message } from "@/hooks/useConversation";
import type { ConversationStage } from "@/types/conversation";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  stage: ConversationStage;
  onSendMessage: (message: string) => void;
}

const STAGE_LABELS: Record<ConversationStage, string> = {
  problem_discovery: "Discovery",
  system_mapping: "System Mapping",
  risk_mapping: "Risk Mapping",
  agent_recommendation: "Agent Match",
  blueprint_generation: "Blueprint",
  blueprint_refinement: "Refinement",
  sandbox_planning: "Sandbox Plan",
  conversion: "Next Steps",
};

const STAGE_ORDER: ConversationStage[] = [
  "problem_discovery",
  "system_mapping",
  "risk_mapping",
  "agent_recommendation",
  "blueprint_generation",
  "blueprint_refinement",
  "sandbox_planning",
  "conversion",
];

const OPENING_MESSAGE =
  "Hello! I'm the Setu Workflow Advisor.\n\nI help business leaders understand, blueprint, and deploy managed AI operators — with approvals and governance built in from day one.\n\nTo get started: **describe a workflow that's broken, manual, or taking too much of your team's time.** The messier the better. I'll ask you a few questions and build you an Agent Blueprint.";

export function ChatPanel({ messages, isLoading, stage, onSendMessage }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stageIndex = STAGE_ORDER.indexOf(stage);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputValue("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Setu Workflow Advisor</p>
            <p className="text-xs text-muted-foreground truncate">
              {STAGE_LABELS[stage]}
            </p>
          </div>
        </div>

        {/* Stage progress bar */}
        <div className="mt-3 flex items-center gap-1">
          {STAGE_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stageIndex ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Stage {stageIndex + 1} of {STAGE_ORDER.length}: {STAGE_LABELS[stage]}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Opening message (always shown) */}
        {messages.length === 0 && (
          <AssistantBubble content={OPENING_MESSAGE} />
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} content={msg.content} />
          ) : (
            <AssistantMessage key={msg.id} message={msg} />
          )
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-bold text-primary">S</span>
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border p-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your workflow problem…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span className="text-xs font-bold text-primary">S</span>
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground whitespace-pre-wrap">
        {content.replace(/\*\*(.+?)\*\*/g, "$1")}
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: Message }) {
  const structured = message.structured;
  const nextQuestions = structured?.next_questions ?? [];

  return (
    <div className="flex flex-col gap-2">
      <AssistantBubble content={message.content} />

      {/* Next question chips */}
      {nextQuestions.length > 0 && (
        <div className="ml-9 flex flex-wrap gap-1.5">
          {nextQuestions.map((q, i) => (
            <span
              key={i}
              className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
            >
              {q}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      {structured?.cta && structured.conversation_stage === "conversion" && (
        <div className="ml-9">
          <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition">
            {structured.cta}
          </button>
        </div>
      )}
    </div>
  );
}
