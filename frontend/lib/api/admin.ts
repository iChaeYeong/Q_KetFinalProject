import { apiFetch } from "./client";

export type AdminUser = {
  userId: string;
  userNm: string;
  userEmail: string;
  userStatus: string;
  roleId: number;
  roleName: string;
};

export type Role = {
  roleId: number;
  roleName: string;
};

export type Venue = {
  venueId: number;
  venueName: string;
};

export const getAdminUsers = () => apiFetch<AdminUser[]>("/admin/users");
export const getRoles = () => apiFetch<Role[]>("/admin/roles");

export const updateUser = (userId: string, data: { roleId?: number; userStatus?: string }) =>
  apiFetch<{ success: boolean }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: data,
  });

export const batchUpdateUsers = (
  changes: Record<string, { roleId?: number; userStatus?: string }>
) =>
  apiFetch<{ success: boolean }>("/admin/users/batch", {
    method: "PATCH",
    body: Object.entries(changes).map(([userId, data]) => ({ userId, ...data })) as unknown as object,
  });

export const getVenues = () => apiFetch<Venue[]>("/admin/venues");

export const createPerformance = (data: {
  pTitle: string;
  venueId: number;
  posterUrl?: string;
  rounds: { roundTime: string; openTime: string }[];
}) =>
  apiFetch<{ success: boolean; performanceId: number }>("/admin/events", {
    method: "POST",
    body: data,
  });

export const addRound = (
  performanceId: number,
  data: { roundTime: string; openTime: string }
) =>
  apiFetch<{ success: boolean; roundId: number }>(
    `/admin/events/${performanceId}/rounds`,
    { method: "POST", body: data }
  );

export const updatePerformance = (
  performanceId: number,
  data: {
    pTitle?: string;
    posterUrl?: string;
    rounds?: { roundId: number; roundTime: string; openTime: string }[];
  }
) =>
  apiFetch<{ success: boolean }>(`/admin/events/${performanceId}`, {
    method: "PUT",
    body: data,
  });

export const deletePerformance = (performanceId: number) =>
  apiFetch<{ success: boolean }>(`/admin/events/${performanceId}`, {
    method: "DELETE",
  });

export const deleteRound = (performanceId: number, roundId: number) =>
  apiFetch<{ success: boolean }>(
    `/admin/events/${performanceId}/rounds/${roundId}`,
    { method: "DELETE" }
  );

export const updateRound = (
  performanceId: number,
  roundId: number,
  data: { roundTime: string; openTime: string }
) =>
  apiFetch<{ success: boolean }>(
    `/admin/events/${performanceId}/rounds/${roundId}`,
    { method: "PUT", body: data }
  );

export const uploadPoster = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message ?? "이미지 업로드에 실패했습니다.");
  }
  return data.url as string;
};
