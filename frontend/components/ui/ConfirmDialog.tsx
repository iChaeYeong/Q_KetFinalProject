"use client";

import { ReactNode } from "react";
import Button from "./Button";

/**
 * 화면 중앙에 뜨는 확인 모달 — 브라우저 기본 confirm()/alert() 대신 쓰는 공통 컴포넌트.
 * 오버레이/박스 스타일은 styles/admin.css의 adminModal* 클래스를 그대로 재사용함.
 *
 * 사용 예:
 *   <ConfirmDialog
 *     open={target !== null}
 *     title="결제를 취소하시겠습니까?"
 *     description="환불이 진행되고 좌석도 함께 취소됩니다."
 *     confirmLabel="환불하기"
 *     confirmVariant="danger"
 *     loading={loading}
 *     error={error}
 *     onConfirm={handleConfirm}
 *     onCancel={() => setTarget(null)}
 *   />
 */
type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "primary",
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="adminModalOverlay" onClick={loading ? undefined : onCancel}>
      <div
        className="adminModal"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adminModalHeader">
          <p style={{ fontWeight: 700, fontSize: "var(--font-xl)" }}>{title}</p>
        </div>

        <div className="adminModalBody">
          {description && (
            <p style={{ color: "var(--text-2)", fontSize: "var(--font-md)" }}>
              {description}
            </p>
          )}
          {error && (
            <p className="errorMsg" style={{ marginTop: "var(--space-3)" }}>
              {error}
            </p>
          )}
        </div>

        <div className="adminModalFooter">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
            {loading ? "처리 중..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
