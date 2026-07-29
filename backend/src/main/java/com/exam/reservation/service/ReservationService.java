package com.exam.reservation.service;

import com.exam.reservation.dto.ReservationDTO;

import java.util.List;
import java.util.Map;

public interface ReservationService {
    Map<String, Object> reserve(String userId,Long reservationId, Long roundId, Long seatId, String queueToken);
    List<ReservationDTO> getMyReservations(String userId);
    Map<String, Object> cancel(Long reservationId, String userId);
}
