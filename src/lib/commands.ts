import type { CommandContext } from "./types";

// Add or override commands here. Each key is what the user types after `:`.
// The function receives the current editor context.
export const commands: Record<string, (ctx: CommandContext) => void> = {
  w:  ({ setViewMode }) => setViewMode("raw"),
  q:  ({ setViewMode }) => setViewMode("rendered"),
  wq: ({ setViewMode }) => setViewMode("raw"),
  "w!": ({ showWarning }) => showWarning('E212: Can\'t open file for writing'),
};
