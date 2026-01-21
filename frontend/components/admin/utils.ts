export function isUserRejectedError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof (error as { message?: string }).message === "string"
      ? (error as { message: string }).message
      : "";
  return (
    message.toLowerCase().includes("user rejected") ||
    message.toLowerCase().includes("user denied") ||
    message.toLowerCase().includes("denied transaction signature")
  );
}
