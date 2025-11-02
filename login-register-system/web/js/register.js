const API_BASE='http://localhost:3000'; // API 서버의 기본 URL을 상수로 정의

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