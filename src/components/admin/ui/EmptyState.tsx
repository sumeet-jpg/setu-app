// @ts-nocheck
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
