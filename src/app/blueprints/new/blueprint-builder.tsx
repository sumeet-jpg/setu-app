"use client";

import { useState, useEffect } from "react";
import { useConversation } from "@/hooks/useConversation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { BlueprintCanvas } from "@/components/blueprint/BlueprintCanvas";
import { LeadCaptureModal } from "@/components/chat/LeadCaptureModal";

const LEAD_CAPTURE_STAGES = ["agent_recommendation", "blueprint_generation", "blueprint_refinement", "sandbox_planning", "conversion"];

export function BlueprintBuilder() {
  const {
    messages,
    isLoading,
    stage,
    blueprint,
    blueprintId,
    conversationId,
    leadCaptured,
    sendMessage,
  } = useConversation();

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadDone, setLeadDone] = useState(false);

  // Show lead capture modal when blueprint is generated and lead not yet captured
  useEffect(() => {
    if (
      LEAD_CAPTURE_STAGES.includes(stage) &&
      blueprintId &&
      !leadDone &&
      !leadCaptured &&
      messages.length >= 2
    ) {
      const timer = setTimeout(() => setShowLeadModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [stage, blueprintId, leadDone, leadCaptured, messages.length]);

  function handleLeadSuccess() {
    setShowLeadModal(false);
    setLeadDone(true);
  }

  function handleLeadSkip() {
    setShowLeadModal(false);
    setLeadDone(true);
  }

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Left: Chat */}
        <div className="flex w-full flex-col border-r border-border md:w-[460px] lg:w-[500px] xl:w-[540px]">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            stage={stage}
            onSendMessage={sendMessage}
          />
        </div>

        {/* Right: Blueprint Canvas */}
        <div className="hidden flex-1 flex-col md:flex">
          <BlueprintCanvas
            blueprint={blueprint}
            stage={stage}
            blueprintId={blueprintId}
          />
        </div>
      </div>

      {/* Lead capture modal */}
      {showLeadModal && (
        <LeadCaptureModal
          conversationId={conversationId}
          blueprintId={blueprintId}
          onSuccess={handleLeadSuccess}
          onSkip={handleLeadSkip}
        />
      )}
    </>
  );
}
