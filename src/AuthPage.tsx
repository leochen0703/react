import { useState } from 'react';
// 💡 移除原本的 useNavigate 引入，因為我們目前沒用到它

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          // 💡 使用 window.location.href 可以確保整個頁面狀態重新整理
          window.location.href = '/'; 
        } else {
          alert('✨ 註冊成功！現在請登入。');
          setIsLogin(true);
          setPassword('');
        }
      } else {
        alert(data.error || '驗證失敗，請檢查帳號密碼');
      }
    } catch (error) {
      // 💡 這裡使用了 error 變數，ESLint 就不會再報錯
      console.error('連線失敗:', error);
      alert('無法連線到後端伺服器，請確認 node server.js 有在跑');
    }
  };

  return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="form-box" style={{ width: '100%', maxWidth: '400px', padding: '30px', border: '2px solid #6366f1' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>
          {isLogin ? '🔑 登入系統' : '📝 註冊新帳號'}
        </h2>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label>帳號名稱</label>
            <input 
              className="input-field" 
              placeholder="請輸入帳號" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label>密碼</label>
            <input 
              className="input-field" 
              type="password" 
              placeholder="請輸入密碼" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="submit-btn" style={{ marginTop: '10px', fontSize: '1.1rem' }}>
            {isLogin ? '登入' : '立即註冊'}
          </button>
        </form>

        <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px dashed #ccc', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', color: '#666' }}>
            {isLogin ? "還沒有帳號嗎？" : "已經有帳號了？"}
          </p>
          <button 
            type="button" // 💡 加上 type="button" 避免觸發 form submit
            onClick={() => setIsLogin(!isLogin)} 
            style={{ 
              background: 'none', 
              border: '1px solid #6366f1', 
              color: '#6366f1', 
              padding: '8px 20px', 
              borderRadius: '20px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLogin ? '👉 切換到註冊畫面' : '👈 返回登入畫面'}
          </button>
        </div>
      </div>
    </div>
  );
};