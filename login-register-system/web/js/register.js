const API_BASE='http://localhost:3000'; // API 서버의 기본 URL을 상수로 정의

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