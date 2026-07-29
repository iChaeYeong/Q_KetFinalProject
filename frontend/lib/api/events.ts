import { apiFetch } from "./client";
import type { Performance } from "../data/types";

// GET /api/events
export async function getEvents(): Promise<Performance[]> {
  return apiFetch<Performance[]>("/events");
}

// GET /api/events/{eventId}
export async function getEvent(eventId: number): Promise<Performance> {
  return apiFetch<Performance>(`/events/${eventId}`);
}
