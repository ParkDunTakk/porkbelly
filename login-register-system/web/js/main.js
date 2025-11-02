const API_BASE = 'http://localhost:3000';
const greetEl = document.getElementById('greet');
const getToken = () => localStorage.getItem('token'); // 항상 최신 토큰을 읽도록 함수로 정의

async function loadMe() {
  const token = getToken();
  if (!token) {
    // 비로그인 UI
    greetEl.textContent = '프로필';
    greetEl.style.color = 'black';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
      // 만약 서버가 리프레시 토큰을 httpOnly 쿠키로 쓰는 경우를 대비
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      // 토큰 만료/무효 → 클라이언트 토큰 정리
      localStorage.removeItem('token');
      greetEl.textContent = '프로필';
      greetEl.style.color = 'black';
      return;
    }
    if (!res.ok) return;

    const { user } = await res.json();
    if (user && user.name) {
      greetEl.textContent = `${user.name} 님 `;
      greetEl.style.color = '#0085ff';
    }
  } catch (e) {
    // 네트워크 오류 시 비로그인 UI 유지
  }
}

document.getElementById('login').onclick = () => (location.href = 'login.html');

document.getElementById('logout').onclick = async () => {
  try {
    // 서버가 httpOnly 쿠키(리프레시 토큰)를 쓴다면 백엔드에 로그아웃도 알려줌 (없어도 무방)
    await fetch(`${API_BASE}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (_) {
    // 서버에 /api/logout 없거나 실패해도 로컬 토큰 삭제로 충분
  }

  // ✅ 핵심: 클라이언트 보관 토큰 삭제
  localStorage.removeItem('token');

  // UI 초기화
  greetEl.textContent = '프로필';
  greetEl.style.color = 'black';

  alert('로그아웃 되었습니다.');

  await loadMe();
  location.reload();
};

loadMe();
