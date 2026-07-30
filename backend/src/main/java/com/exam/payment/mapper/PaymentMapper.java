package com.exam.payment.mapper;

import com.exam.payment.dto.PaymentDTO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PaymentMapper {
    int save(PaymentDTO paymentDTO);
}
