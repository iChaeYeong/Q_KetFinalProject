import { apiFetch } from "./client";
import type { Seat } from "../data/types";

// GET /api/seats/round/{roundId}
export async function getSeats(roundId: number): Promise<Seat[]> {
  return apiFetch<Seat[]>(`/schedules/${roundId}/seats`);
}
