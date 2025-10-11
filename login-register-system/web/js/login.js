const API_BASE='http://localhost:3000';

document.getElementById('login-form').addEventListener
(
    'submit',async(e)=>
    {
        e.preventDefault();
        const fd=new FormData(e.target);
        const data=Object.fromEntries(fd.entries());

        try
        {
            const res=await fetch
            (
                `${API_BASE}/api/login`,
                {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify(data)
                }
            );

            const json=await res.json();
            if(!res.ok)
            {
                alert(json.error || '로그인 실패')
                return;
            }

            localStorage.setItem('token',json.token);
            alert(`환영합니다, ${json.user.name}님!`)
            location.href='main.html';
        }
        catch(err)
        {
            console.error(err);
            alert('네트워크 오류');
        }
    }
);