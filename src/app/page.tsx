// @ts-nocheck
import { redirect } from "next/navigation";

/**
 * Root route — redirect to the main Blueprint Builder.
 * The app entrypoint is always the conversation-first blueprint UX.
 */
export default function RootPage() {
  redirect("/blueprints/new");
}
