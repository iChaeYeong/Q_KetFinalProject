"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";

export default function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { userSession, setUserSession, isLoading } = useAuth();

  // [TODO-NAV-LOGOUT] 로그아웃
  const handleLogout = async () => {
    await logout().catch(() => { });
    setUserSession(null);
    router.push("/");
  };

  return (
    <nav className="siteNav">
      <div className="siteNavInner">
        <Link href="/" className="siteNavBrand">Q-Ket</Link>
        {!isLoading && (
          <div className="siteNavLinks">
            <Link href="/" className={pathname === "/" ? "siteNavLink siteNavLinkActive" : "siteNavLink"}>
              공연
            </Link>
            {userSession ? (
              <>
                <Link href="/mypage" className={pathname === "/mypage" ? "siteNavLink siteNavLinkActive" : "siteNavLink"}>
                  마이페이지
                </Link>
                {(userSession.roleId === 2 || userSession.roleId === 3) && (
                  <Link href="/admin/performances" className={pathname.startsWith("/admin/performances") ? "siteNavLink siteNavLinkActive" : "siteNavLink"}>
                    공연 관리
                  </Link>
                )}
                {userSession.roleId === 3 && (
                  <Link href="/admin/users" className={pathname.startsWith("/admin/users") ? "siteNavLink siteNavLinkActive" : "siteNavLink"}>
                    사용자 관리
                  </Link>
                )}
                <span className="siteNavUser">{userSession.userNm}님</span>
                <button className="siteNavLink siteNavLogout" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/login" className="siteNavLink siteNavLogin">
                로그인
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
