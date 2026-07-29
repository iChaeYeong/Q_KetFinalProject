package com.exam.reservation.mapper;

import com.exam.reservation.dto.ReservationDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ReservationMapper {
    int save(ReservationDTO reservationDTO);
    int insertHistory(ReservationDTO reservationDTO);
    List<ReservationDTO> findByUserId(String userId);
    ReservationDTO findById(Long reservationId);
    int cancel(Long reservationId);
}
