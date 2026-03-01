import { useState } from 'react';
// import { useNavigate } from 'react-router';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      // 💡 登入成功後建議用 window.location.href 強制刷新一下，確保 Sidebar 狀態同步
      window.location.href = '/'; 
    } else {
      alert(data.error || '登入失敗'); // 修正：後端回傳的是 error 欄位
    }
  };

  return (
    <div className="page-content auth-container">
      <h1 className="title">🔑 進入 IdeaFlow</h1>
      <form onSubmit={handleLogin} className="form-box auth-box">
        <div className="input-group">
          <label>帳號 Username</label>
          <input 
            className="textarea-field auth-input" 
            placeholder="請輸入帳號" 
            value={username}
            onChange={e => setUsername(e.target.value)} 
          />
        </div>
        <div className="input-group">
          <label>密碼 Password</label>
          <input 
            className="textarea-field auth-input" 
            type="password" 
            placeholder="請輸入密碼" 
            value={password}
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <button type="submit" className="submit-btn auth-btn">立即登入</button>
        <p style={{textAlign: 'center', fontSize: '0.9rem', color: '#666', marginTop: '15px'}}>
          還沒有帳號嗎？ <strong>聯繫管理員註冊</strong>
        </p>
      </form>
    </div>
  );
};