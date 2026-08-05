package com.exam.payment.dto;

import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.time.LocalDateTime;

@Data
@Alias("RefundDTO")
public class RefundDTO {

    private Long refundId;
    private Long paymentId;
    private Long cancelAmount;
    private String cancelReason;
    private String tossTransactionKey;
    private LocalDateTime canceledAt;

    private String insId;
    private String insIp;
    private String uptId;
    private String uptIp;
}
