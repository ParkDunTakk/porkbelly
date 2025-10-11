const API_BASE='http://localhost:3000';
const greetEl=document.getElementById('greet');
const token=localStorage.getItem('token');

async function loadMe()
{
    if(!token) return;
    const res=await fetch
    (
        `${API_BASE}/api/me`,
        {
            headers:{Authorization:`Bearer ${token}`}
        }
    );
    if(!res.ok) return;
    const {user}=await res.json();
    if(user&&user.name)
    {
        greetEl.textContent=`${user.name} 님 `;
    }
}

document.getElementById('login').onclick=()=>location.href='login.html';
document.getElementById('logout').onclick=()=>
{
    greetEl.textContent='프로필';
    alert('로그아웃 되었습니다.');
};

loadMe();