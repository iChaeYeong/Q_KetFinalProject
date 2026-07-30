package com.exam.payment.service;

import com.exam.payment.dto.PaymentConfirmRequestDTO;
import com.exam.payment.dto.PaymentDTO;

public interface PaymentService {
    PaymentDTO confirm(PaymentConfirmRequestDTO request, String userId, String clientIp);
}
