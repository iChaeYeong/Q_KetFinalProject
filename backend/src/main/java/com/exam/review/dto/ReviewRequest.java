package com.exam.review.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private String content;
    private int rating;
    private boolean containsSpoiler;
}
