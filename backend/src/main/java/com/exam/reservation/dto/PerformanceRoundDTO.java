package com.exam.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.time.LocalDateTime;

@Data
@Alias("PerformanceRoundDTO")
public class PerformanceRoundDTO {

    private Long roundId;
    private Long performanceId;
    //소문자 한글자로 인해서 camel-case 가 안먹음 (PerformanceDTO와 동일한 이슈)
    @JsonProperty("pTitle")
    private String pTitle;
    @JsonProperty("pLocation")
    private String pLocation;
    private LocalDateTime roundTime;
    private String roundStatus;
}
