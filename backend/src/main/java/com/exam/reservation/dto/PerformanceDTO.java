package com.exam.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Alias("PerformanceDTO")
public class PerformanceDTO {

    private Long performanceId;
    private Long venueId;
    //소문자 한글자로 인해서 camel-case 가 안먹음
    @JsonProperty("pTitle")
    private String pTitle;
    @JsonProperty("pLocation")
    private String pLocation;
    private String posterUrl;
    private LocalDateTime createdPer;
    private List<RoundDTO> rounds;
}
