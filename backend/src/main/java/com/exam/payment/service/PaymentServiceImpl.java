package com.exam.payment.service;

import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.payment.dto.PaymentConfirmRequestDTO;
import com.exam.payment.dto.PaymentDTO;
import com.exam.payment.dto.RefundDTO;
import com.exam.payment.mapper.PaymentMapper;
import com.exam.reservation.dto.SeatDTO;
import com.exam.reservation.mapper.SeatMapper;
import com.exam.reservation.service.ReservationService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final String TOSS_API_BASE = "https://api.tosspayments.com/v1/payments";

    private final SeatMapper seatMapper;
    private final ReservationService reservationService;
    private final PaymentMapper paymentMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String tossSecretKey;

    public PaymentServiceImpl(SeatMapper seatMapper,
                               ReservationService reservationService,
                               PaymentMapper paymentMapper,
                               @org.springframework.beans.factory.annotation.Value("${toss.secret-key}") String tossSecretKey) {
        this.seatMapper = seatMapper;
        this.reservationService = reservationService;
        this.paymentMapper = paymentMapper;
        this.tossSecretKey = tossSecretKey;
    }

    @Override
    @Transactional
    public PaymentDTO confirm(PaymentConfirmRequestDTO request, String userId, String clientIp) {
        // 멱등성 체크: 같은 orderId로 이미 처리된 결제면 재승인/재예매 시도 없이 그 결과를 그대로 반환.
        // (버튼 중복클릭, success 페이지 새로고침, 네트워크 재시도 등으로 같은 요청이 다시 들어오는 경우 대비 —
        //  이 체크가 없으면 이미 확정된 좌석에 대해 reserve()가 실패로 보고, 방금 승인된 결제를 오히려 자동취소해버림)
        PaymentDTO existing = paymentMapper.findByOrderId(request.getOrderId());
        if (existing != null) {
            return existing;
        }

        SeatDTO seat = seatMapper.findById(request.getSeatId());
        if (seat == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "존재하지 않는 좌석입니다.");
        }

        Long expectedAmount = seatMapper.findPriceByRoundIdAndGrade(request.getRoundId(), seat.getGrade());
        if (expectedAmount == null || !expectedAmount.equals(request.getAmount())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "결제 금액이 올바르지 않습니다.");
        }

        Map<String, Object> tossResponse = confirmWithToss(request);

        Map<String, Object> reserveResult = reservationService.reserve(
                userId, request.getReservationId(), request.getRoundId(), request.getSeatId(),
                request.getQueueToken(), clientIp);

        if (!Boolean.TRUE.equals(reserveResult.get("success"))) {
            // 결제는 이미 승인됐는데 좌석 확보에 실패한 경우 — 고객에게 돈만 받고 좌석을 못 주는 상황을
            // 막기 위해 방금 승인한 결제를 즉시 자동 취소함
            cancelWithToss(request.getPaymentKey(), "좌석 예매 실패로 인한 자동 취소");
            throw new BusinessException(ErrorCode.SEAT_ALREADY_TAKEN);
        }

        PaymentDTO payment = new PaymentDTO();
        payment.setReservationId(request.getReservationId());
        payment.setUserId(userId);
        payment.setOrderId(request.getOrderId());
        payment.setPaymentKey(request.getPaymentKey());
        payment.setAmount(request.getAmount());
        payment.setPayStatus(String.valueOf(tossResponse.get("status")));
        payment.setApprovedAt(LocalDateTime.now());
        payment.setInsId(userId);
        payment.setInsIp(clientIp);

        try {
            paymentMapper.save(payment);
        } catch (DuplicateKeyException e) {
            // 위 findByOrderId 체크 이후 극히 짧은 순간에 동일 orderId 요청이 동시에 들어와
            // 먼저 INSERT를 끝낸 경우 — 이번 요청은 실패 처리하지 않고 먼저 처리된 결과를 그대로 반환
            return paymentMapper.findByOrderId(request.getOrderId());
        }

        return payment;
    }

    @Override
    public List<PaymentDTO> getMyPayments(String userId) {
        return paymentMapper.findByUserId(userId);
    }

    @Override
    @Transactional
    public PaymentDTO cancelPayment(Long paymentId, String userId, String clientIp) {
        PaymentDTO payment = paymentMapper.findById(paymentId);
        if (payment == null || !payment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }
        return doCancel(payment, userId, userId, clientIp, "고객 요청에 의한 결제 취소");
    }

    @Override
    @Transactional
    public PaymentDTO adminCancelPayment(Long paymentId, String actorId, String clientIp) {
        PaymentDTO payment = paymentMapper.findById(paymentId);
        if (payment == null) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }
        // 소유자 체크 없이 관리자가 임의 결제 건을 취소 — 접근 권한 자체는 컨트롤러에서 이미 admin(3)으로 막아둠
        return doCancel(payment, payment.getUserId(), actorId, clientIp, "관리자(" + actorId + ")에 의한 환불 처리");
    }

    // reservationOwnerId: ReservationService.cancel()이 예매 소유자와 일치해야만 취소를 허용하므로 항상 결제 당사자여야 함
    // actorId: 이번 취소를 실제로 수행한 사람(본인 또는 관리자) — PAYMENTS 감사 컬럼(upt_id)에 기록됨
    private PaymentDTO doCancel(PaymentDTO payment, String reservationOwnerId, String actorId, String clientIp, String cancelReason) {
        if (!"DONE".equals(payment.getPayStatus())) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_CANCELED);
        }

        // 사용자가 직접 요청한 취소든 관리자 처리든 확실히 실패를 알려줘야 함 — confirm()의 자동취소(cancelWithToss)와
        // 달리 여기서는 예외를 삼키지 않고 그대로 던져서 "취소가 안 됐다"는 걸 호출한 쪽이 알 수 있게 함
        Map<String, Object> tossResponse;
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    TOSS_API_BASE + "/" + payment.getPaymentKey() + "/cancel",
                    new HttpEntity<>(Map.of("cancelReason", cancelReason), buildAuthHeaders()),
                    Map.class
            );
            tossResponse = response.getBody();
        } catch (HttpClientErrorException e) {
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED, extractTossMessage(e, ErrorCode.PAYMENT_CANCEL_FAILED.getMessage()));
        }

        // 결제 취소가 끝난 뒤 좌석도 함께 반납 — 이미 취소된 예매 등으로 실패해도 결제 취소 자체는 되돌리지 않음
        // (환불은 이미 토스에 확정됐으므로, 좌석 반납 실패는 별도로 확인이 필요한 상황이지 결제 취소를 무효화할 사유는 아님)
        reservationService.cancel(payment.getReservationId(), reservationOwnerId, clientIp);

        paymentMapper.updateStatus(payment.getPaymentId(), "CANCELED", actorId, clientIp);
        saveRefundRecord(payment, tossResponse, cancelReason, actorId, clientIp);
        payment.setPayStatus("CANCELED");
        return payment;
    }

    // 토스 취소 응답(cancels 배열의 마지막 항목)에서 취소 금액/거래키/취소 시각을 뽑아 REFUND에 저장.
    // 응답 파싱에 실패해도 결제 취소 자체(위에서 이미 완료됨)는 되돌리지 않고, 금액만 결제 전액으로 폴백
    @SuppressWarnings("unchecked")
    private void saveRefundRecord(PaymentDTO payment, Map<String, Object> tossResponse,
                                   String cancelReason, String actorId, String clientIp) {
        RefundDTO refund = new RefundDTO();
        refund.setPaymentId(payment.getPaymentId());
        refund.setCancelReason(cancelReason);
        refund.setInsId(actorId);
        refund.setInsIp(clientIp);
        refund.setCancelAmount(payment.getAmount());

        List<Map<String, Object>> cancels = tossResponse != null
                ? (List<Map<String, Object>>) tossResponse.get("cancels") : null;
        if (cancels != null && !cancels.isEmpty()) {
            Map<String, Object> lastCancel = cancels.get(cancels.size() - 1);
            Object cancelAmount = lastCancel.get("cancelAmount");
            if (cancelAmount instanceof Number) {
                refund.setCancelAmount(((Number) cancelAmount).longValue());
            }
            Object transactionKey = lastCancel.get("transactionKey");
            if (transactionKey != null) {
                refund.setTossTransactionKey(String.valueOf(transactionKey));
            }
            Object canceledAt = lastCancel.get("canceledAt");
            if (canceledAt != null) {
                try {
                    refund.setCanceledAt(OffsetDateTime.parse(String.valueOf(canceledAt)).toLocalDateTime());
                } catch (Exception ignore) {
                    // 토스 응답 시각 형식이 예상과 다르면 파싱만 건너뜀 — 이 컬럼은 nullable이라 취소 처리 자체엔 영향 없음
                }
            }
        }

        paymentMapper.saveRefund(refund);
    }

    @Override
    public void deletePayment(Long paymentId, String userId, String clientIp) {
        PaymentDTO payment = paymentMapper.findById(paymentId);
        if (payment == null || !payment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }
        // 취소(환불)된 결제만 목록에서 지울 수 있음 — 진행 중인(DONE) 결제 기록을 임의로 안 보이게 하면
        // 실제로는 유효한 결제인데 사용자 화면에서만 사라져 혼란을 줄 수 있음
        if (!"CANCELED".equals(payment.getPayStatus())) {
            throw new BusinessException(ErrorCode.PAYMENT_DELETE_NOT_ALLOWED);
        }
        paymentMapper.markDeleted(paymentId, userId, clientIp);
    }

    private Map<String, Object> confirmWithToss(PaymentConfirmRequestDTO request) {
        Map<String, Object> body = Map.of(
                "paymentKey", request.getPaymentKey(),
                "orderId", request.getOrderId(),
                "amount", request.getAmount()
        );
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    TOSS_API_BASE + "/confirm",
                    new HttpEntity<>(body, buildAuthHeaders()),
                    Map.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_FAILED, extractTossMessage(e, ErrorCode.PAYMENT_CONFIRM_FAILED.getMessage()));
        }
    }

    private void cancelWithToss(String paymentKey, String reason) {
        try {
            restTemplate.postForEntity(
                    TOSS_API_BASE + "/" + paymentKey + "/cancel",
                    new HttpEntity<>(Map.of("cancelReason", reason), buildAuthHeaders()),
                    Map.class
            );
        } catch (Exception e) {
            // 취소 API 실패는 로그만 남기고 삼킴 — 여기서 예외를 던지면 원래 실패 사유(좌석 선점됨)가
            // 취소 실패 예외에 가려지므로, 이 경우 토스 콘솔에서 수동 환불 확인이 필요함
        }
    }

    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String encoded = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encoded);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    @SuppressWarnings("unchecked")
    private String extractTossMessage(HttpClientErrorException e, String fallback) {
        try {
            Map<String, Object> body = e.getResponseBodyAs(Map.class);
            if (body != null && body.get("message") != null) {
                return String.valueOf(body.get("message"));
            }
        } catch (Exception ignore) {
            // 파싱 실패 시 기본 메시지로 폴백
        }
        return fallback;
    }
}
