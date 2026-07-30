package com.exam.payment.service;

import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.payment.dto.PaymentConfirmRequestDTO;
import com.exam.payment.dto.PaymentDTO;
import com.exam.payment.mapper.PaymentMapper;
import com.exam.reservation.dto.SeatDTO;
import com.exam.reservation.mapper.SeatMapper;
import com.exam.reservation.service.ReservationService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;

@Service
public class PaymentServiceImpl implements PaymentService {

    // 프론트(app/payments/checkout/page.tsx GRADE_PRICE)와 동일한 값.
    // 결제 금액을 클라이언트가 보낸 그대로 믿지 않고 좌석 등급 기준으로 서버에서 다시 계산해 대조하기 위함
    // (좌석 등급별 가격을 관리하는 DB 테이블이 따로 없어 부득이 하드코딩 — 프론트 값 바뀌면 같이 고쳐야 함)
    private static final Map<String, Long> GRADE_PRICE = Map.of(
            "VIP", 220000L,
            "R", 154000L,
            "S", 99000L
    );

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
        SeatDTO seat = seatMapper.findById(request.getSeatId());
        if (seat == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "존재하지 않는 좌석입니다.");
        }

        Long expectedAmount = GRADE_PRICE.get(seat.getGrade());
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

        paymentMapper.save(payment);

        return payment;
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
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_FAILED, extractTossMessage(e));
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
    private String extractTossMessage(HttpClientErrorException e) {
        try {
            Map<String, Object> body = e.getResponseBodyAs(Map.class);
            if (body != null && body.get("message") != null) {
                return String.valueOf(body.get("message"));
            }
        } catch (Exception ignore) {
            // 파싱 실패 시 기본 메시지로 폴백
        }
        return ErrorCode.PAYMENT_CONFIRM_FAILED.getMessage();
    }
}
