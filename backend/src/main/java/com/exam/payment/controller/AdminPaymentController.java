package com.exam.payment.controller;

import com.exam.auth.dto.UserDTO;
import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.common.util.WebUtil;
import com.exam.payment.dto.PaymentDTO;
import com.exam.payment.mapper.PaymentMapper;
import com.exam.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 결제 내역 관리자 조회/환불 처리 전용 — 결제 확정·삭제는 PaymentController(사용자 본인)가 그대로 담당하고
// 여기는 관리자가 전체 사용자의 결제 내역을 상태/키워드로 필터 조회하고, 필요 시 대신 환불(취소) 처리하는 것만 다룸
// (같은 데이터를 다루는 PaymentMapper, PaymentController와 같은 패키지에 둠)
@RestController
@RequestMapping("/admin/payments")
public class AdminPaymentController {

    private final PaymentMapper paymentMapper;
    private final PaymentService paymentService;

    public AdminPaymentController(PaymentMapper paymentMapper, PaymentService paymentService) {
        this.paymentMapper = paymentMapper;
        this.paymentService = paymentService;
    }

    private boolean isAdmin(UserDTO user) {
        return user != null && Long.valueOf(3L).equals(user.getRoleId());
    }

    /***********************************
     * URL : "/admin/payments"
     * 이름 : 결제 내역 필터 조회
     * 기능 : 관리자가 전체 사용자의 결제 내역을 결제상태(payStatus)/키워드(아이디·이름·공연명)로 필터링해 조회
     * method : Get
     ************************************/
    @GetMapping
    public List<PaymentDTO> list(@RequestParam(required = false) String payStatus,
                                  @RequestParam(required = false) String keyword,
                                  HttpSession session) {
        UserDTO loginUser = (UserDTO) session.getAttribute("loginUser");
        if (!isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.ADMIN_ONLY);
        }
        return paymentMapper.findAllForAdmin(payStatus, keyword);
    }

    /***********************************
     * URL : "/admin/payments/{paymentId}/cancel"
     * 이름 : 결제 환불 처리
     * 기능 : 관리자가 사용자를 대신해 결제를 환불(취소) — 좌석도 함께 반납되어 다시 예매 가능해짐
     * method : Post
     ************************************/
    @PostMapping("/{paymentId}/cancel")
    public PaymentDTO cancel(@PathVariable Long paymentId,
                              HttpSession session,
                              HttpServletRequest servletRequest) {
        UserDTO loginUser = (UserDTO) session.getAttribute("loginUser");
        if (!isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.ADMIN_ONLY);
        }
        return paymentService.adminCancelPayment(paymentId, loginUser.getUserId(), WebUtil.getClientIp(servletRequest));
    }
}
