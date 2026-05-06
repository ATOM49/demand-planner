export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const payload = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function normalizeError(error: unknown): { message: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unknown error" };
}
