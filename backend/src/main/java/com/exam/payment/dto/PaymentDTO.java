package com.exam.payment.dto;

import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.time.LocalDateTime;

@Data
@Alias("PaymentDTO")
public class PaymentDTO {

    private Long paymentId;
    private Long reservationId;
    private String userId;
    private String orderId;
    private String paymentKey;
    private Long amount;
    private String payStatus;
    private LocalDateTime approvedAt;

    private String insId;
    private String insIp;
    private String uptId;
    private String uptIp;
}
