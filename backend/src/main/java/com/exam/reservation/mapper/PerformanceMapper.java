package com.exam.reservation.mapper;

import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.dto.RoundDTO;
import com.exam.reservation.dto.VenueDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PerformanceMapper {
    List<PerformanceDTO> findAll();
    List<VenueDTO> findAllVenues();
    int insert(PerformanceDTO performanceDTO);
    int insertRound(RoundDTO roundDTO);
    int initReservationSlots(@Param("roundId") Long roundId, @Param("performanceId") Long performanceId);

    boolean hasPassedRound(Long performanceId);
    boolean hasPassedRoundById(Long roundId);
    int updatePerformance(PerformanceDTO performanceDTO);
    int deleteReservationHistoryByPerformanceId(Long performanceId);
    int deleteReservationsByPerformanceId(Long performanceId);
    int deleteRoundsByPerformanceId(Long performanceId);
    int deletePerformance(Long performanceId);
    int deleteReservationHistoryByRoundId(Long roundId);
    int deleteReservationsByRoundId(Long roundId);
    int deleteRound(Long roundId);
    int updateRound(RoundDTO roundDTO);
}
