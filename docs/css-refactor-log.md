# CSS 표준화 / 컴포넌트화 작업 로그

작
## 1단계 — CSS 값 표준화 (완료)

하드코딩된 px 값들을 `:root`에 정의한 CSS 변수로 교체.
폰트 크기, 여백/간격, 색상변수(기존) 추가해서 하드코딩된 값들 찾아서 변수로 바꿔놨어요
지금 styles/base.css 파일에 설명 되어있을거에요.

적용 파일: `globals.css`, `BookButton.tsx`, `app/mypage/page.tsx`, `app/admin/performances/page.tsx` 등 인라인 스타일 쓰던 컴포넌트 전체.

---

## 2단계 — CSS 파일 분리 + 주석 (완료)

### 구조 변경
`app/globals.css` 1346줄 → 역할별로 13개 파일로 분리, `@import`로 재조립.
13개로 이미 코드에 분류가 되어있길래 분류해서 파일들 만들어놨고 기존에 있던 globals.css는 조립창구 역할로 쓰면될거같아요.
.tsx 파일을 건드려서 구조 바꿀까 했는데 그냥 import로만 해도 충분할거같아서 기존에있던 .tsx파일들은 안 건드렸어요
각 파일 상단에 "이 파일 역할 / 담당 화면" 주석 + 클래스별 설명 주석 추가했습니다.
```
app/globals.css 
styles/
 ├─ base.css       (reset, :root 변수)
 ├─ nav.css        (상단 네비게이션)
 ├─ layout.css     (페이지 공통 레이아웃 틀)
 ├─ auth.css       (로그인/회원가입 + 폼)
 ├─ button.css     (버튼 4종)
 ├─ card.css       (카드 / 공연 목록 그리드)
 ├─ badge.css      (상태 뱃지)
 ├─ queue.css      (대기열 화면)
 ├─ seat.css       (좌석 선택 화면)
 ├─ mypage.css     (마이페이지)
 ├─ message.css    (공통 에러/성공/로딩 메시지)
 ├─ admin.css      (관리자 전체 화면)
 └─ responsive.css (반응형 미디어쿼리, 항상 마지막 import)
```

### 발견 및 수정한 버그 
버그 2가지 있었는데 
1. 기존파일에 버튼에 대한 css가 중복 정의 되어있어서 나중 정의로 되어있는걸로 놔두고 나머지하나는 삭제했습니다. '.btnSecondary' / '.btnDanger' 이거 두개 였습니다. -> 수정완료!
2. 관리자페이지 드롭다운이 원래 선택되면 보라색으로 바뀌고 수정된 행은 색이 바뀌는걸로 되어있었는데 코드에 정의해놓지 않은 변수로 되어있어서 적용이 안되고있더라고요. `.adminSelect` / `.adminInput` 두 개 교체해서 색 변경 되도록 해놨습니다 -> 수정완료!

---

## 3단계 — JSX 컴포넌트화 (진행 중)

같은 패턴 반복되는거 컴포넌트화 하는중..
버튼부분만 하나 만들었고 코드에도 변경해놨습니다.
아래 완료파트에 두개만 일단 했고 진행예정에 있는 파일들 내용 다 바꾸고 로드맵대로 하면될거같아요.
버튼까지는 손으로 코딩했는데 이후 작업까지 손으로 하려면 너무 오래걸릴거같아서 Ai써서 바꾸는게 좋을거같아요.

### 완료
- `frontend/components/ui/Button.tsx` 생성. 
- `components/BookButton.tsx` 적용 완료

### 진행 예정 (진호가 직접 작업 중)
아래 파일들에서 `<button className="btnPrimary/btnSecondary/btnDanger">` → `<Button variant="...">` 로 교체 필요:

- [ ] `app/(auth)/signup/page.tsx`
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/mypage/page.tsx`
- [ ] `app/admin/performances/page.tsx`
- [ ] `app/admin/performances/new/page.tsx`
- [ ] `app/admin/users/page.tsx`
- [ ] `app/seats/[scheduleId]/page.tsx`

변경 방식: className 문자열만 컴포넌트 호출로 바꾸는 것 — CSS 값/디자인은 그대로.

### 컴포넌트화 로드맵 (Button 다음 순서, 실제 코드 반복 빈도 기준)

| 순서 | 컴포넌트 | 대상 className | 반복 횟수 | 비고 |
|---|---|---|---|---|
| 1 | Button | `btnPrimary`/`btnSecondary`/`btnGhost`/`btnDanger` | 20+ | (진행 중) |
| 2 | Badge | `badge` + `badgeOpen`/`badgeClosed`/`badgeSoldout`/`badgeVip`/`badgeR`/`badgeS` | `app/page.tsx`, `app/seats/[scheduleId]/page.tsx` 2곳 | seats 페이지는 `` `badge badge${grade}` `` 조건문까지 있어서 컴포넌트로 빼면 코드 제일 깔끔해짐 |
| 3 | FormField / Input | `field`+`fieldLabel`+`fieldInput`(로그인/회원가입), `adminFormRow`+`adminLabel`+`adminInput`(관리자 폼) | 7~13회 | 반복 빈도 제일 높음. "라벨+입력창" 세트를 하나로 묶기 |
| 4 | PageHeader | `pageWrap`+`pageTitle`+`pageSubtitle`+`pageHeader` | 6~8회 | 거의 모든 페이지 최상단에 동일 구조로 반복 |
| 5 | StatusMessage | `loadingMsg`, `errorMsg` | 3~7회 | "로딩 중"/"에러" 안내 문구 |
| 낮음 | 기타 | `seatLegendItem`/`seatLegendDot`(좌석 범례), `adminPosterWrap` 등 포스터 업로드 영역 | 2~4회 | 반복 적어서 급하지 않음, 여유 있을 때 |

---

*최종 업데이트: 2026-07-30*
