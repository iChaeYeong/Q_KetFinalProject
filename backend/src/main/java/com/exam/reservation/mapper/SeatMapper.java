package com.exam.reservation.mapper;

import com.exam.reservation.dto.SeatDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SeatMapper {
    List<SeatDTO> findByRoundId(Long roundId);
    SeatDTO findById(Long seatId);
    int updateStatus(Long seatId, String status);
    Long findPriceByRoundIdAndGrade(@Param("roundId") Long roundId, @Param("grade") String grade);
}

