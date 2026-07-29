import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://app.jun979.click";

export const options = {
  thresholds: {
    // 요청 실패율 1% 미만
    http_req_failed: ["rate<0.01"],

    // 전체 요청의 95%가 1초 이내
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/`);

  check(response, {
    "메인 페이지 응답 200": (res) => res.status === 200,
  });

  // 사용자가 페이지를 보는 시간 표현
  sleep(1);
}