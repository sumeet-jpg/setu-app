import type { Metadata } from "next";
import { BlueprintBuilder } from "./blueprint-builder";

export const metadata: Metadata = {
  title: "New Blueprint",
  description: "Describe your workflow and Setu will build your Agent Blueprint.",
};

export default function NewBlueprintPage() {
  return <BlueprintBuilder />;
}
