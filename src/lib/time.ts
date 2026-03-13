const PRODUCT_TIME_ZONE = "America/New_York";

export function fmtProductDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: PRODUCT_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getProductTimeZone() {
  return PRODUCT_TIME_ZONE;
}
