import { apiFetch } from "./client";
import type { QueueStatus } from "../data/types";

// POST /api/queues
// 응답: { queueToken: "..." }
export async function joinQueue(scheduleId: number): Promise<{ queueToken: string }> {
  return apiFetch<{ queueToken: string }>("/queues", {
    method: "POST",
    body: { scheduleId },
  });
}

// GET /api/queues/{queueToken}
export async function getQueueStatus(queueToken: string): Promise<QueueStatus> {
  return apiFetch<QueueStatus>(`/queues/${queueToken}`);
}

// POST /api/queues/{queueToken}/leave
export async function leaveQueue(queueToken: string): Promise<void> {
  navigator.sendBeacon(`/api/queues/${queueToken}/leave`);
}