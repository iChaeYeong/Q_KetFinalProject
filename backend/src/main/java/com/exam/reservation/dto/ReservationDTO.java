package com.exam.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.time.LocalDateTime;

@Data
@Alias("ReservationDTO")
public class ReservationDTO {

    private Long reservationId;
    private Long historyId;
    private String userId;
    private Long seatId;
    private Long roundId;
    private String reservedStatus;
    private LocalDateTime createdReserved;

    // 히스토리 insert 용
    private String action;

    // JOIN 결과용 필드
    private String seatRow;
    private String seatColume;
    private String grade;
    @JsonProperty("pTitle")
    private String pTitle;
    private LocalDateTime roundTime;
}
