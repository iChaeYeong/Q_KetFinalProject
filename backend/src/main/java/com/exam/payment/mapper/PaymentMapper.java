package com.exam.payment.mapper;

import com.exam.payment.dto.PaymentDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PaymentMapper {
    int save(PaymentDTO paymentDTO);
    PaymentDTO findByOrderId(String orderId);
    List<PaymentDTO> findByUserId(String userId);
}
