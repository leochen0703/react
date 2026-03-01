import { useState, useEffect, useRef, useMemo } from 'react' 
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router' 
import { AuthPage } from './AuthPage';
import './App.css'

// 1. 更新資料型別：新增 image_url
interface Note {
  id: number;
  content: string;
  author: string;
  owner: string;
  color?: string;
  image_url?: string; // 💡 新增圖片網址欄位
  is_completed?: number;
  created_at?: string;
}

// 2. 定義 HomePage 接收參數的型別 (保持不變)
interface HomePageProps {
  notes: Note[];
  fetchNotes: () => void;
  deleteNote: (id: number) => Promise<void>;
}

// 抽取出來的留言板頁面組件
const HomePage = ({ notes, fetchNotes, deleteNote }: HomePageProps) => {
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null); // 💡 新增狀態儲存選取的檔案
  const fileInputRef = useRef<HTMLInputElement>(null); // 💡 用於清空檔案輸入框
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 💡 功能 1：預覽網址
  const [searchTerm, setSearchTerm] = useState(''); // 💡 功能 2：搜尋關鍵字

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile)); // 💡 產生預覽圖網址
    } else {
      setPreviewUrl(null);
    }
  };

  // 💡 功能 5：關鍵字篩選 (使用 useMemo 優化效能)
  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  // 💡 功能 3：時間格式化函數
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '剛剛'; // 如果後端還沒回傳時間，先顯示剛剛
    const date = new Date(dateStr);
    // 檢查日期是否有效
    if (isNaN(date.getTime())) return '剛剛';
    return date.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei',hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

    const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) return; // 💡 內容或圖片至少要有一個
    
    const token = localStorage.getItem('token'); 
    
    // 💡 關鍵：因為要上傳檔案，必須使用 FormData
  const pastelColors = [
  'rgba(255, 205, 210, 0.6)', // 櫻花粉
  'rgba(248, 187, 208, 0.6)', // 玫瑰粉
  'rgba(225, 190, 231, 0.6)', // 薰衣草紫
  'rgba(209, 196, 233, 0.6)', // 夢幻紫
  'rgba(187, 222, 251, 0.6)', // 天空藍
  'rgba(179, 229, 252, 0.6)', // 湖水藍
  'rgba(178, 235, 242, 0.6)', // 蒂芬妮綠
  'rgba(178, 223, 219, 0.6)', // 薄荷綠
  'rgba(200, 230, 201, 0.6)', // 嫩草綠
  'rgba(220, 237, 200, 0.6)', // 奇異果綠
  'rgba(255, 249, 196, 0.6)', // 檸檬黃
  'rgba(255, 236, 179, 0.6)', // 杏桃橙
  'rgba(255, 224, 178, 0.6)', // 夕陽橙
  'rgba(215, 204, 200, 0.6)', // 奶茶色
  'rgba(245, 245, 245, 0.6)'  // 霧面灰
];
  const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];

  const formData = new FormData();
  formData.append('content', text);
  formData.append('isAnonymous', String(isAnonymous));
  formData.append('color', randomColor); // 💡 把隨機顏色傳給後端
  if (file) formData.append('image', file);
    
    await fetch('http://localhost:3000/api/notes', {
      method: 'POST',
      headers: { 
        // 💡 關鍵：使用 FormData 時，不要手動設定 Content-Type 標頭
        'Authorization': `Bearer ${token}` 
      },
      body: formData // 💡 直接傳送 formData 物件
    });

    setText(''); 
    clearFile();
    fetchNotes();
  };

  return (
    <div className="page-content">
      <h1 className="title"> 2026 生活牆</h1>

      {/* 💡 功能 5：搜尋框 */}
      <div className="search-bar-container">
        <input 
          type="text" 
          placeholder="🔍 搜尋關鍵字或作者..." 
          className="input-field search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <br />
      
      {localStorage.getItem('token') ? (
        <form onSubmit={handleSubmit} className="form-box">
          <textarea 
            placeholder="分享你的靈感或生活照片..." 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            className="textarea-field" 
          />
          
          {/* 💡 功能 1：發布前的預覽圖 */}
          {previewUrl && (
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="upload-preview" />
              <button type="button" className="remove-preview" onClick={clearFile}>✕</button>
            </div>
          )}

          <div className="form-controls-row">
            <label className="file-upload-label">
              📸 {file ? '已選擇照片' : '新增照片'}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                hidden 
              />
            </label>
            <br /><br />
            <div className="checkbox-group">
              <input 
                type="checkbox" 
                id="anonymous" 
                checked={isAnonymous} 
                onChange={(e) => setIsAnonymous(e.target.checked)} 
              />
              <label htmlFor="anonymous">匿名發布</label>
            </div>
          </div>

          <button type="submit" className="submit-btn" style={{marginTop: '10px'}}>
            {isAnonymous ? '👤 匿名發布' : '🚀 以本人身份發布'}
          </button>
        </form>
      ) : (
        <div className="form-box login-prompt">
          <p>想分享靈感嗎？請先登入。</p>
          <Link to="/login" className="submit-btn" style={{ textDecoration: 'none' }}>前往登入</Link>
        </div>
      )}

      {/* 💡 功能 4：瀑布流佈局牆 */}
      <div className="masonry-grid">
        {filteredNotes.map((note) => (
          <div 
            key={note.id} 
            className="card masonry-item" 
            style={{ backgroundColor: note.color || 'rgba(255,255,255,0.7)' }}
          >
            {note.owner === 'system_admin' && (
              <div className="admin-tag">📌 官方公告</div>
            )}

            {note.image_url && (
              <img src={note.image_url} alt="Post" className="post-image" />
            )}

            <div className="card-body">
              <p className="card-content">{note.content}</p>
              
              <div className="card-footer">
                <div className="note-info">
                  <span className="author">@{note.author}</span>
                  <span className="timestamp">{formatTime(note.created_at)}</span> {/* 💡 功能 3 */}
                </div>
                {note.owner !== 'system_admin' && (
                  <button onClick={() => deleteNote(note.id)} className="delete-icon-btn">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="page-content">
    <h1 className="title">關於本專案</h1>
    <div className="form-box">
      <p>這是一個使用 React 19 + Vite 7 + SQLite 打造的全端應用程式。</p>
      <p>技術棧：React Router v7, Node.js Express, SQLite3。</p>
    </div>
  </div>
);

function App() {
  const [notes, setNotes] = useState<Note[]>([]); // 💡 補回資料狀態
  const location = useLocation();
  const navigate = useNavigate();

  // 每次路由 (location) 改變時，React 會重新執行 App 函式，自然會重新讀取最新的 token
  const isLoggedIn = !!localStorage.getItem('token');

  // 💡 補回抓取資料邏輯
  const fetchNotes = () => {
    fetch('http://localhost:3000/api/notes')
      .then(res => res.json())
      .then(data => setNotes(data));
  };

  useEffect(() => { 
    fetchNotes(); 
  }, []); // 只有初次載入時抓取，或是你可以根據需求調整
  const deleteNote = async (id: number) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`http://localhost:3000/api/notes/${id}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // 💡 刪除也需要身份證！
    }
  });

  if (res.ok) {
    fetchNotes(); // 成功後刷新清單
  } else {
    alert("刪除失敗，可能這不是你的留言？");
  }
};
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // 登出後跳轉
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">💡 IdeaFlow</div>
        <nav className="nav-menu">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>🏠 首頁牆</Link>
          <Link to="/about" className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>ℹ️ 關於</Link>
          <hr style={{ opacity: 0.1, margin: '10px 0' }} />
          {isLoggedIn ? (
            <button onClick={handleLogout} className="nav-item logout-btn">🔓 登出系統</button>
          ) : (
            <Link to="/login" className={`nav-item ${location.pathname === '/login' ? 'active' : ''}`}>🔒 登入</Link>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          {/* 💡 修正原本 HomePage 傳參的地方 */}
          <Route path="/" element={<HomePage notes={notes} fetchNotes={fetchNotes} deleteNote={deleteNote} />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;