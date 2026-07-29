package com.exam.common.controller;

import com.exam.common.dto.UserDTO;
import com.exam.common.mapper.UserMapper;
import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.dto.RoundDTO;
import com.exam.reservation.dto.VenueDTO;
import com.exam.reservation.mapper.PerformanceMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserMapper userMapper;
    private final PerformanceMapper performanceMapper;
    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket:qket-posters}")
    private String bucket;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    @Value("${cloud.aws.cloudfront.domain:}")
    private String cloudfrontDomain;

    public AdminController(UserMapper userMapper, PerformanceMapper performanceMapper, S3Client s3Client) {
        this.userMapper = userMapper;
        this.performanceMapper = performanceMapper;
        this.s3Client = s3Client;
    }

    /***********************************
     *  URL      :   "/upload"
     *  이름      :   포스터 이미지 업로드
     *  기능      :   포스터 이미지 S3 업로드
     *  method   :   Post
     *  param    :   MultipartFile, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 포스터 이미지 S3 업로드 — 매니저(2) 이상
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadPoster(@RequestParam("file") MultipartFile file, HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        try {
            String ext = file.getOriginalFilename() != null
                    ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.'))
                    : ".jpg";
            String key = "posters/" + UUID.randomUUID() + ext;
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
            String baseUrl = (cloudfrontDomain != null && !cloudfrontDomain.isBlank())
                    ? "https://" + cloudfrontDomain
                    : "https://" + bucket + ".s3." + region + ".amazonaws.com";
            String url = baseUrl + "/" + key;
            return ResponseEntity.ok(Map.of("success", true, "url", url));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "업로드 실패: " + e.getMessage()));
        }
    }

    private UserDTO getLoginUser(HttpSession session) {
        return (UserDTO) session.getAttribute("loginUser");
    }

    private boolean isAdmin(UserDTO user) {
        return user != null && Long.valueOf(3L).equals(user.getRoleId());
    }

    private boolean isManagerOrAdmin(UserDTO user) {
        return user != null && (Long.valueOf(2L).equals(user.getRoleId()) || Long.valueOf(3L).equals(user.getRoleId()));
    }

    /***********************************
     *  URL      :   "/roles"
     *  이름      :   역할 목록 조회
     *  기능      :   역할 목록보기
     *  method   :   Get
     *  param    :   HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 역할 목록 — 관리자(3)만
    @GetMapping("/roles")
    public ResponseEntity<?> getRoles(HttpSession session) {
        if (!isAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
        return ResponseEntity.ok(userMapper.findAllRoles());
    }

    /***********************************
     *  URL      :   "/users"
     *  이름      :   사용자 목록 조회
     *  기능      :   사용자 목록 조회하기
     *  method   :   Get
     *  param    :   HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 사용자 목록 조회 — 관리자(3)만
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(HttpSession session) {
        if (!isAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
        return ResponseEntity.ok(userMapper.findAll());
    }

    /***********************************
     *  URL      :   "/users/{userId}"
     *  이름      :   사용자 정보 수정
     *  기능      :   관리자가 사용자의 상태 및 권한을 수정
     *  method   :   Patch
     *  param    :   String, UserDTO, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 사용자 상태/권한 수정 — 관리자(3)만
    @PatchMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable String userId,
                                        @RequestBody UserDTO body,
                                        HttpSession session) {
        if (!isAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
        body.setUserId(userId);
        userMapper.updateUser(body);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /***********************************
     *  URL      :   "/users/batch"
     *  이름      :   사용자 정보 일괄 수정
     *  기능      :   관리자가 사용자 상태 및 권한 일괄 수정
     *  method   :   Patch
     *  param    :   List<UserDTO>, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 사용자 상태/권한 일괄 수정 — 관리자(3)만
    @PatchMapping("/users/batch")
    public ResponseEntity<?> batchUpdateUsers(@RequestBody List<UserDTO> users, HttpSession session) {
        if (!isAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
        for (UserDTO user : users) {
            userMapper.updateUser(user);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    /***********************************
     *  URL      :   "/venues"
     *  이름      :   공연장 목록 조회
     *  기능      :   공연장 목록 조회
     *  method   :   Get
     *  param    :   HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 공연장 목록 — 매니저(2) 이상
    @GetMapping("/venues")
    public ResponseEntity<?> getVenues(HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        return ResponseEntity.ok(performanceMapper.findAllVenues());
    }

    /***********************************
     *  URL      :   "/events"
     *  이름      :   공연 등록
     *  기능      :   새로운 공연과 회차를 등록
     *  method   :   Post
     *  param    :   PerformanceDTO, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 공연 추가 (회차 포함) — 매니저(2) 이상
    @Transactional
    @PostMapping("/events")
    public ResponseEntity<?> createPerformance(@RequestBody PerformanceDTO dto, HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        performanceMapper.insert(dto);
        if (dto.getRounds() != null) {
            for (RoundDTO round : dto.getRounds()) {
                round.setPerformanceId(dto.getPerformanceId());
                performanceMapper.insertRound(round);
                performanceMapper.initReservationSlots(round.getRoundId(), dto.getPerformanceId());
            }
        }
        return ResponseEntity.ok(Map.of("success", true, "performanceId", dto.getPerformanceId()));
    }

    /***********************************
     *  URL      :   "/events/{performanceId}"
     *  이름      :   공연 및 회차 수정
     *  기능      :   공연 수정 (제목, 포스터, 회차 포함)
     *  method   :   Put
     *  param    :   Long, PerformanceDTO, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 공연 수정 (제목, 포스터, 회차 포함) — 매니저(2) 이상
    @Transactional
    @PutMapping("/events/{performanceId}")
    public ResponseEntity<?> updatePerformance(@PathVariable Long performanceId,
                                               @RequestBody PerformanceDTO dto,
                                               HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        dto.setPerformanceId(performanceId);
        performanceMapper.updatePerformance(dto);
        if (dto.getRounds() != null) {
            for (RoundDTO round : dto.getRounds()) {
                if (!performanceMapper.hasPassedRoundById(round.getRoundId())) {
                    performanceMapper.updateRound(round);
                }
            }
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    /***********************************
     *  URL      :   "/events/{performanceId}"
     *  이름      :   공연 삭제
     *  기능      :   공연 삭제 — 오픈된 회차 있으면 거부
     *  method   :   Delete
     *  param    :   Long, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 공연 삭제 — 오픈된 회차 있으면 거부 — 매니저(2) 이상
    @Transactional
    @DeleteMapping("/events/{performanceId}")
    public ResponseEntity<?> deletePerformance(@PathVariable Long performanceId, HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        if (performanceMapper.hasPassedRound(performanceId))
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "예매 오픈된 회차가 있어 삭제할 수 없습니다."));
        performanceMapper.deleteReservationHistoryByPerformanceId(performanceId);
        performanceMapper.deleteReservationsByPerformanceId(performanceId);
        performanceMapper.deleteRoundsByPerformanceId(performanceId);
        performanceMapper.deletePerformance(performanceId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /***********************************
     *  URL      :   "/events/{performanceId}/rounds/{roundId}"
     *  이름      :   회차 수정
     *  기능      :   회차 수정 — 오픈 시간 지나면 거부
     *  method   :   Put
     *  param    :   Long, Long, RoundDTO, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 회차 수정 — 오픈 시간 지나면 거부 — 매니저(2) 이상
    @PutMapping("/events/{performanceId}/rounds/{roundId}")
    public ResponseEntity<?> updateRound(@PathVariable Long performanceId,
                                         @PathVariable Long roundId,
                                         @RequestBody RoundDTO dto,
                                         HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        if (performanceMapper.hasPassedRoundById(roundId))
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "예매 오픈된 회차는 수정할 수 없습니다."));
        dto.setRoundId(roundId);
        performanceMapper.updateRound(dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /***********************************
     *  URL      :   "/events/{performanceId}/rounds/{roundId}"
     *  이름      :   공연 회차 삭제
     *  기능      :   회차 삭제 — 오픈 시간 지나면 거부
     *  method   :   Put
     *  param    :   Long, Long, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 회차 삭제 — 오픈 시간 지나면 거부 — 매니저(2) 이상
    @Transactional
    @DeleteMapping("/events/{performanceId}/rounds/{roundId}")
    public ResponseEntity<?> deleteRound(@PathVariable Long performanceId,
                                         @PathVariable Long roundId,
                                         HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        if (performanceMapper.hasPassedRoundById(roundId))
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "예매 오픈된 회차는 삭제할 수 없습니다."));
        performanceMapper.deleteReservationHistoryByRoundId(roundId);
        performanceMapper.deleteReservationsByRoundId(roundId);
        performanceMapper.deleteRound(roundId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /***********************************
     *  URL      :   "/events/{performanceId}/rounds"
     *  이름      :   공연 회차 추가
     *  기능      :   회차 추가 + 예약 슬롯 초기화
     *  method   :   Post
     *  param    :   Long, RoundDTO, HttpSession
     *  return   :   ResponseEntity<?>
     ************************************/
    // 회차 추가 + 예약 슬롯 초기화 — 매니저(2) 이상
    @Transactional
    @PostMapping("/events/{performanceId}/rounds")
    public ResponseEntity<?> addRound(@PathVariable Long performanceId,
                                      @RequestBody RoundDTO dto,
                                      HttpSession session) {
        if (!isManagerOrAdmin(getLoginUser(session)))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
        dto.setPerformanceId(performanceId);
        performanceMapper.insertRound(dto);
        performanceMapper.initReservationSlots(dto.getRoundId(), performanceId);
        return ResponseEntity.ok(Map.of("success", true, "roundId", dto.getRoundId()));
    }
}
