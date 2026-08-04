export type Review = {
  reviewId: number;
  performanceId: number;
  userId: string;
  userNm: string;
  content: string;
  rating: number;
  containsSpoiler: "Y" | "N";
  insDe: string;
};
