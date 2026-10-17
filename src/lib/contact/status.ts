/** Le cycle d'une demande dans les Coulisses : il mesure combien deviennent des projets payés. */
export const REQUEST_STATUSES = ["NEW", "QUALIFIED", "IN_DISCUSSION", "WON", "LOST"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && (REQUEST_STATUSES as readonly string[]).includes(value);
}
