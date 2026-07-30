package com.exam.payment.controller;

import com.exam.auth.dto.UserDTO;
import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.common.util.WebUtil;
import com.exam.payment.dto.PaymentConfirmRequestDTO;
import com.exam.payment.dto.PaymentDTO;
import com.exam.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /***********************************
     *  URL      :  "/payments/confirm"
     *  이름      :   confirm
     *  기능      :   토스페이먼츠 결제 최종 승인 + 좌석 예매 확정
     *  method   :   POST
     *  param    :   PaymentConfirmRequestDTO, HttpSession, HttpServletRequest
     *  return   :   PaymentDTO
     ************************************/
    @PostMapping("/confirm")
    public PaymentDTO confirm(@RequestBody PaymentConfirmRequestDTO request,
                               HttpSession session,
                               HttpServletRequest servletRequest) {
        UserDTO loginUser = (UserDTO) session.getAttribute("loginUser");
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.LOGIN_REQUIRED);
        }
        return paymentService.confirm(request, loginUser.getUserId(), WebUtil.getClientIp(servletRequest));
    }
}
