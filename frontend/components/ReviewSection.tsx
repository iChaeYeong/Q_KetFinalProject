"use client";

// 공연 상세 화면 "감상평" 탭 내용 (REV01). PerformanceTabs.tsx 에서 렌더링됨.
// 마이페이지(app/mypage/page.tsx)의 리스트+본인만 액션 패턴을 그대로 따름:
// 목록은 useState+useEffect로 불러오고, 삭제는 confirm() 후 실행, 실패는 alert()로 보여줌.

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Review } from "@/lib/data/types";
import { getReviews, writeReview, updateReview, deleteReview } from "@/lib/api/reviews";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Textarea from "@/components/ui/Textarea";
import StatusMessage from "@/components/ui/StatusMessage";
import StarRating from "@/components/ui/StarRating";

type Props = { performanceId: number };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// 작성/수정 공용 폼
function ReviewForm({
  initialContent = "",
  initialRating = 5,
  initialSpoiler = false,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialContent?: string;
  initialRating?: number;
  initialSpoiler?: boolean;
  submitLabel: string;
  onSubmit: (content: string, rating: number, containsSpoiler: boolean) => Promise<void>;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [spoiler, setSpoiler] = useState(initialSpoiler);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("감상평 내용을 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(content, rating, spoiler);
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reviewForm">
      <FormField label="별점">
        <StarRating value={rating} onChange={setRating} />
      </FormField>

      <FormField label="감상평">
        <Textarea
          placeholder="공연은 어떠셨나요?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </FormField>

      <label className="reviewFormRow">
        <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
        스포일러가 포함되어 있어요
      </label>

      <div className="reviewFormActions">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
        )}
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  isMine,
  onUpdate,
  onDelete,
}: {
  review: Review;
  isMine: boolean;
  onUpdate: (content: string, rating: number, containsSpoiler: boolean) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSpoiler = review.containsSpoiler === "Y";

  if (editing) {
    return (
      <ReviewForm
        initialContent={review.content}
        initialRating={review.rating}
        initialSpoiler={isSpoiler}
        submitLabel="수정 완료"
        onCancel={() => setEditing(false)}
        onSubmit={async (content, rating, spoiler) => {
          await onUpdate(content, rating, spoiler);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="reviewCard">
      <div className="reviewCardHeader">
        <div>
          <p className="reviewAuthor">{review.userNm}</p>
          <StarRating value={review.rating} />
          <p className="reviewDate">{formatDate(review.insDe)}</p>
        </div>

        {isMine && (
          <div className="reviewActions">
            <Button variant="ghost" onClick={() => setEditing(true)}>
              수정
            </Button>
            <Button variant="danger" onClick={onDelete}>
              삭제
            </Button>
          </div>
        )}
      </div>

      {isSpoiler && !revealed ? (
        <button type="button" className="reviewSpoilerBtn" onClick={() => setRevealed(true)}>
          스포일러 포함 — 클릭해서 보기
        </button>
      ) : (
        <p className="reviewContent">{review.content}</p>
      )}
    </div>
  );
}

export default function ReviewSection({ performanceId }: Props) {
  const { userSession } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    getReviews(performanceId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [performanceId]);

  // 내가 이미 쓴 감상평이 있으면 작성 폼 대신 그 카드의 "수정" 버튼으로 고치게 함 (공연당 1개 정책)
  const myReview = reviews.find((r) => r.userId === userSession?.userId);

  const handleWrite = async (content: string, rating: number, containsSpoiler: boolean) => {
    const created = await writeReview(performanceId, content, rating, containsSpoiler);
    setReviews((prev) => [created, ...prev]);
    setWriting(false);
  };

  const handleUpdate = async (reviewId: number, content: string, rating: number, containsSpoiler: boolean) => {
    const updated = await updateReview(reviewId, content, rating, containsSpoiler);
    setReviews((prev) => prev.map((r) => (r.reviewId === reviewId ? updated : r)));
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("감상평을 삭제하시겠습니까?")) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      {userSession &&
        !myReview &&
        (writing ? (
          <ReviewForm submitLabel="등록" onCancel={() => setWriting(false)} onSubmit={handleWrite} />
        ) : (
          <Button
            variant="secondary"
            onClick={() => setWriting(true)}
            style={{ marginBottom: "var(--space-4)" }}
          >
            감상평 작성하기
          </Button>
        ))}

      {loading && <StatusMessage variant="loading">불러오는 중...</StatusMessage>}

      {!loading && reviews.length === 0 && <p className="detailEmpty">아직 작성된 감상평이 없습니다.</p>}

      <div className="reviewList">
        {reviews.map((review) => (
          <ReviewCard
            key={review.reviewId}
            review={review}
            isMine={review.userId === userSession?.userId}
            onUpdate={(content, rating, spoiler) => handleUpdate(review.reviewId, content, rating, spoiler)}
            onDelete={() => handleDelete(review.reviewId)}
          />
        ))}
      </div>
    </div>
  );
}
