"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";   //auth api
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  //세션 저장
  const { setUserSession } = useAuth();

  // 입력값 상태
  // 만약 회원가입 성공 시 userId 자동 입력
  const [userId, setUserId] = useState("");


  useEffect(() => {
    const prefill = sessionStorage.getItem("prefillUserId");
    if (prefill) setUserId(prefill);
  }, []);

  const [pwd, setPwd] = useState("");

  // UI 상태
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);



  // userID, pwd 빈값 체크 
  // 빈값이 존재시 error 변수에 에러메세지 저장
  const handleLogin = async () => {
    if (!userId || !pwd) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }
    //문제 없을시 로딩 true
    setLoading(true);
    setError("");

    try {
      const data = await login(userId, pwd);
      if (!data.success) {
        setError(data.message ?? "로그인에 실패했습니다.");
        return;
      }
      setUserSession(data.user ?? null);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }

  }



  return (
    <div className="authWrap">
      <div className="authBox">
        <p className="authLogo">Q-Ket</p>
        <h1 className="authTitle">로그인</h1>
        <p className="authDesc">공연을 예매하려면 로그인이 필요합니다.</p>

        <div className="field">
          <label className="fieldLabel">아이디</label>
          <input
            className="fieldInput"
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="fieldLabel">비밀번호</label>
          <input
            className="fieldInput"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}

            //엔터 키 입력 시 handleLogin() 실행
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <p className="errorMsg">{error}</p>}

        <button
          className="btnPrimary btnPrimaryFull"

          onClick={handleLogin}          // 로그인 버튼 클릭 시 handleLogin() 실행
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <p className="authHelper">
          계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
