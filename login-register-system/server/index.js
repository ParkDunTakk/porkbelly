require('dotenv').config();
const express=require('express');
const cors=require('cors');
const mysql=require('mysql2/promise');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const app=express();

app.use
(
    cors
    (
        {
            origin:process.env.CLIENT_ORIGIN,
            credentials:true
        }
    )
);

app.use(express.json());

process.on
(
    'unhandledRejection',(reason)=>
    {
        console.error('[unhandledRejection]',reason);    
    }
);
process.on
(
    'uncaughtException',(err)=>
    {
        console.error('[uncaughtException]',err);
    }
)

let pool;

function requireEnv(name) 
{
  if (!process.env[name]) 
  {
    throw new Error(`Missing required env: ${name}`);
  }
  return process.env[name];
}

function signToken(user) 
{
  const secret = requireEnv('JWT_SECRET');
  return jwt.sign
  (
    { id: user.id, userid: user.userid, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
}

function auth(req, res, next) 
{
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try 
  {
    req.user = jwt.verify(token, requireEnv('JWT_SECRET'));
    next();
  } 
  catch (e) 
  {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get
(
  '/health', (req, res) => 
  {
    res.json({ ok: true, env: !!process.env.JWT_SECRET });
  }
);

app.get
(
  '/api/debug/ping-db', async (req, res) => 
  {
    try 
    {
      const [rows] = await pool.query('SELECT 1 AS ok');
      res.json({ ok: rows[0].ok === 1 });
    } 
    catch (e) 
    {
      console.error('[ping-db]', e);
      res.status(500).json({ error: 'DB 연결 실패', detail: e.message });
    }
  }
);

// 회원가입
app.post
(
  '/api/register', async (req, res) => 
  {
    try 
    {
      let { userid, password, name, sex, age, mbti } = req.body;

      // 필수값
      if (!userid || !password || !name) 
      {
        return res.status(400).json({ error: '필수값 누락(userid, password, name)' });
      }

      // 성별 정규화
      if (!sex) sex = null;
      const allowedSex = [null, 'M', 'F', 'O'];
      if (!allowedSex.includes(sex)) 
      {
        return res.status(400).json({ error: "sex는 'M','F','O' 또는 빈값" });
      }

      // 나이 숫자 변환
      if (age === '' || age === undefined) age = null;

      // 중복 검사
      const [dup] = await pool.query('SELECT id FROM users WHERE userid=?', [userid]);
      if (dup.length) return res.status(409).json({ error: '이미 사용중인 아이디' });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query
      (
        `INSERT INTO users (userid, password_hash, name, sex, age, mbti) VALUES (?, ?, ?, ?, ?, ?)`,
        [userid, hash, name, sex, age, mbti || null]
      );

      const user = { id: result.insertId, userid, name };
      const token = signToken(user);
      res.status(201).json({ user, token });
    } 
    catch (e) 
    {
      console.error('[POST /api/register] ', e);
      res.status(500).json({ error: '서버 오류', detail: e.message });
    }
  }
);

// 로그인
app.post
(
  '/api/login', async (req, res) => 
  {
    try 
    {
      const { userid, password } = req.body;
      if (!userid || !password) return res.status(400).json({ error: '필수값 누락' });

      const [rows] = await pool.query('SELECT * FROM users WHERE userid=?', [userid]);
      if (!rows.length) return res.status(401).json({ error: '없는 아이디입니다.' });

      const u = rows[0];
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });

      const user = { id: u.id, userid: u.userid, name: u.name };
      const token = signToken(user);
      res.json({ user, token });
    } 
    catch (e) 
    {
      console.error('[POST /api/login] ', e);
      res.status(500).json({ error: '서버 오류', detail: e.message });
    }
  }
);

// 내 정보
app.get
(
  '/api/me', auth, async (req, res) => 
  {
    try 
    {
      const [rows] = await pool.query
      (
        'SELECT id, userid, name, sex, age, mbti, created_at FROM users WHERE id=?',
        [req.user.id]
      );
      res.json({ user: rows[0] || null });
    } 
    catch (e) 
    {
      console.error('[GET /api/me] ', e);
      res.status(500).json({ error: '서버 오류', detail: e.message });
    }
  }
);

// 에러 미들웨어
app.use
(
  (err, req, res, next) => 
  {
    console.error('[ERROR MIDDLEWARE]', err);
    res.status(500).json({ error: '서버 오류', detail: err.message });
  }
);

// 안전한 부팅 : 풀 만든 뒤 listen 
async function start() 
{
  try 
  {
    // 필수 env 먼저 검증
    requireEnv('PORT');
    requireEnv('DB_HOST'); requireEnv('DB_USER'); requireEnv('DB_PASSWORD'); requireEnv('DB_NAME');
    requireEnv('CLIENT_ORIGIN'); requireEnv('JWT_SECRET');

    pool = await mysql.createPool
    (
      {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 10
      }
    );

    // DB 핑으로 확인해보기
    await pool.query('SELECT 1');

    app.listen
    (
      process.env.PORT, () => 
      {
        console.log(`Server on http://localhost:${process.env.PORT}`);
      }
    );
  } 
  catch (e) 
  {
    console.error('[SERVER START FAILED]', e);
    process.exit(1);
  }
}

start();