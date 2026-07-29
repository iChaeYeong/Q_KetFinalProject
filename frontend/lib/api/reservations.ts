import { apiFetch } from "./client";
import type { Reservation, ApiResult } from "../data/types";

// POST /api/reservations
export async function createReservation(
    reservationId: number,
    roundId: number,
    seatId: number,
    queueToken?: string
): Promise<ApiResult> {
  return apiFetch<ApiResult>("/reservations", {
    method: "POST",
    body: { reservationId, roundId, seatId, queueToken },
  });
}

// GET /api/reservations/my
// 응답 형태: { reservations: [...] }
export async function getMyReservations(): Promise<Reservation[]> {
  const data = await apiFetch<{ reservations: Reservation[] }>("/reservations/my");
  return data.reservations ?? [];
}

// DELETE /api/reservations/{reservationId}
export async function cancelReservation(reservationId: number): Promise<ApiResult> {
  return apiFetch<ApiResult>(`/reservations/${reservationId}`, { method: "DELETE" });
}
