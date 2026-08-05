package com.exam.payment.mapper;

import com.exam.payment.dto.PaymentDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {
    int save(PaymentDTO paymentDTO);
    PaymentDTO findByOrderId(String orderId);
    List<PaymentDTO> findByUserId(String userId);
    PaymentDTO findById(Long paymentId);
    int updateStatus(@Param("paymentId") Long paymentId, @Param("payStatus") String payStatus,
                      @Param("uptId") String uptId, @Param("uptIp") String uptIp);
    int markDeleted(@Param("paymentId") Long paymentId,
                     @Param("uptId") String uptId, @Param("uptIp") String uptIp);

    // 관리자 결제 내역 필터 조회
    List<PaymentDTO> findAllForAdmin(@Param("payStatus") String payStatus, @Param("keyword") String keyword);
}
