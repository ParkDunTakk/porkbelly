const API_BASE='http://localhost:3000'; // API 서버의 기본 URL을 상수로 정의

// ✅ 모든 필수 입력 완료 시 회원가입 버튼 활성화
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const btn = document.getElementById('register-btn');

  // 최초엔 비활성화
  if (btn) btn.disabled = true;

  function validateForm() {
    if (!form || !btn) return;

    const userid = form.querySelector('input[name="userid"]')?.value.trim();
    const password = form.querySelector('input[name="password"]')?.value.trim();
    const name = form.querySelector('input[name="name"]')?.value.trim();

    const ageStr = form.querySelector('input[name="age"]')?.value;
    const ageNum = ageStr === '' ? NaN : Number(ageStr);
    const ageOk = Number.isFinite(ageNum) && ageNum >= 1 && ageNum <= 130; // 나이 필수 + 범위

    const sexChecked = !!form.querySelector('input[name="sex"]:checked');

    const mbtiHidden = document.getElementById('mbtiHidden');
    const mbtiOk = !!mbtiHidden && mbtiHidden.value.trim().length === 4;

    const allOk = !!(userid && password && name && sexChecked && ageOk && mbtiOk);
    btn.disabled = !allOk;
  }

  // 입력/변경 시마다 검사
  form.addEventListener('input', validateForm);
  form.addEventListener('change', validateForm);

  // 페이지 로드 직후 한번 검사
  validateForm();

  // 이미 추가해둔 "라디오 재클릭 해제" 코드가 있다면, 그 안에서도 validateForm을 호출해주면 좋아요.
  // 예: 라디오 해제 후 버튼이 다시 비활성화되어야 하니까요.
  document.querySelectorAll('input[type="radio"]').forEach(r => {
    r.addEventListener('click', () => {
      // MBTI 라디오 해제 시 hidden 값 비우는 로직을 넣었다면 그 직후에:
      validateForm();
    });
  });
});


// 라디오 다시 클릭 시 선택 취소 기능 (성별 + MBTI 모두)
document.addEventListener('DOMContentLoaded', () => {
  let lastChecked = {};

  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('click', function () {
      const name = this.name;
      // 같은 항목 다시 클릭 → 해제
      if (lastChecked[name] === this) {
        this.checked = false;
        lastChecked[name] = null;
        // MBTI 자동 조합 갱신용
        if (name.startsWith('mbti_')) {
          const mbtiHidden = document.getElementById('mbtiHidden');
          if (mbtiHidden) mbtiHidden.value = '';
        }
      } else {
        lastChecked[name] = this;
      }
    });
  });
});

// MBTI 선택값을 자동으로 조합해 hidden input(name="mbti")에 넣는 로직
(function() {
  const form = document.getElementById('register-form');
  const mbtiHidden = document.getElementById('mbtiHidden');
  if (!form || !mbtiHidden) return; // 해당 요소 없으면 그냥 스킵

  function getVal(name) {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value.toUpperCase() : '';
  }

  function updateMBTI() {
    const v =
      getVal('mbti_ei') +
      getVal('mbti_ns') +
      getVal('mbti_ft') +
      getVal('mbti_jp');
    mbtiHidden.value = v.length === 4 ? v : '';
  }

  // 변화 감지
  form.addEventListener('change', (e) => {
    if (e.target.name && e.target.name.startsWith('mbti_')) updateMBTI();
  });

  // 제출 직전 확인 (누락 방지)
  form.addEventListener('submit', (e) => {
    updateMBTI();
    if (mbtiHidden.value.length !== 4) {
      e.preventDefault();
      alert('MBTI 네 글자를 모두 선택해 주세요.');
    }
  });
})();

document.getElementById('register-form').addEventListener // register ID를 가진 폼 요소에
(
    'submit',async(e)=> //submit 이벤트 리스너를 추가
    {
        e.preventDefault(); // 폼 기본 제출 동작인 페이지 새로고침을 막음
        const fd=new FormData(e.target); // 제출된 폼 요소인 e.target에서 FormData 객체를 생성하여 폼 데이터 캡쳐
        const data=Object.fromEntries(fd.entries()); // FormData 객체 데이터를 JavaScript 객체 형태로 변환

        // 네트워크 요청 중 발생할 수 있는 오류를 처리하기 위한 기능
        try 
        {
            const res=await fetch
            (
                `${API_BASE}/api/register`,
                {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify(data)
                }
            );

            const json=await res.json();
            if(!res.ok)
            {
                alert(json.error||'회원가입 실패');
                return;
            }

            localStorage.setItem('token',json.token);
            alert('회원가입 완료');
            location.href='login.html';
        }
        catch(err)
        {
            console.error(err);
            alert('네트워크 오류')
        }
    }
);