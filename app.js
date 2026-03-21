const { useState, useEffect, useMemo, useRef, useCallback } = React;
    
    // NƠI ĐIỀN CẤU HÌNH FIREBASE CỦA HUY
    const MY_FIREBASE_CONFIG = {
      apiKey: "AIzaSyBPYnBhPME-BTST63QDyP0gUho07G9QyQc",
      authDomain: "tracnghiem-31c44.firebaseapp.com",
      projectId: "tracnghiem-31c44",
      storageBucket: "tracnghiem-31c44.firebasestorage.app",
      messagingSenderId: "742429088050",
      appId: "1:742429088050:web:9ff00733cc280a1e49df2b",
      measurementId: "G-VNXTHZV6ZH"
    };

    // ĐÃ THÊM API KEY IMGBB CỦA HUY
    const IMGBB_API_KEY = "f20580866c25ba3e4cf065d604ff1fc5";

    const MAX_QUIZZES_PER_USER = 30; // Đã tăng giới hạn lên để tránh lỗi đầy kho lưu trữ
    const ADMIN_USERNAME = "huy20022k8";

    const RESULT_REMARKS = {
      bad: [
        "🗣Alo Vũ à Vũ", "Nhìn cái điểm xong dính c2 Điêu Thuyền mịa luôn🗿", "Hết cứu🤡", 
        "Học hành đỉnh cao thực sự, đúng là 'thiên tài' có khác🐧", "Thôi kiếp này coi như bỏ🙃"
      ],
      average: [
        "Thôi thì cũng có nỗ lực, đồng ý cho qua 👍", "Trộm vía vẫn còn thở được, ko sao, ko sao 😀",
        "Ủa sao điểm lại ra thế này ta 🌝", "Cũng tàm tạm vừa đủ qua môn rồi😛"
      ],
      good: [
        "Đù vuýp🤯", "Đù, học kiểu đéo gì mà điểm cháy vailon thế☠️",
        "Làm lại mấy lần rồi mà điểm chất thế💩", "Adu, nay đc gặp học bá luon😬"
      ]
    };

    // KHỞI TẠO FIREBASE
    let auth = null;
    let db = null;
    let isSetupNeeded = false;
    let appId = typeof __app_id !== 'undefined' ? __app_id.replace(/\//g, '-') : 'quiz-app-huy-github';
    let finalConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : MY_FIREBASE_CONFIG;

    if (!finalConfig || !finalConfig.apiKey) {
      isSetupNeeded = true;
    } else {
      try {
        if (!firebase.apps.length) firebase.initializeApp(finalConfig);
        auth = firebase.auth();
        db = firebase.firestore();
      } catch(e) {
        console.error("Lỗi khởi tạo Firebase:", e);
        isSetupNeeded = true;
      }
    }

    const quizzesPath = `artifacts/${appId}/public/data/quizzes`;
    const usersPath = `artifacts/${appId}/public/data/users`;

    const shuffleArray = (array) => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };
    const generateShareCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
      return result;
    };
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const Icons = {
      Upload: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
      Image: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
      Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
      Share: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
      Play: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      Copy: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
      Trash: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      User: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      Sun: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      Moon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
      Eye: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      EyeOff: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
      UserX: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>,
      Edit: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
      Key: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
      Plus: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
      Alert: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
      Search: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
      Shield: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
      Clock: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block -mt-1 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    };

    function SetupScreen() {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 font-sans">
          <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
            <h1 className="text-3xl font-black text-red-600 mb-4">Chưa có kết nối Database!</h1>
            <p className="text-slate-600 mb-4">Hãy kiểm tra lại cấu hình Firebase trong code nhé.</p>
          </div>
        </div>
      );
    }

    const LoadingScreen = () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-[9999] transition-colors duration-300">
        <div className="relative w-16 h-16 mb-8">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase animate-pulse text-sm">Đang tải dữ liệu...</p>
      </div>
    );

    const ShortAnswerInput = ({ value = '', onChange, readOnly, isCorrect, showResult }) => {
      const chars = (value || '').split('');
      const boxes = [0, 1, 2, 3];
      
      let borderColorClass = 'border-slate-300 dark:border-slate-600';
      let bgColorClass = 'bg-white dark:bg-slate-800';
      let textColorClass = 'text-slate-800 dark:text-slate-100';

      if (showResult) {
        borderColorClass = isCorrect ? 'border-green-500' : 'border-red-500';
        bgColorClass = isCorrect ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';
        textColorClass = isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
      } else if (value) {
        borderColorClass = 'border-blue-500';
        bgColorClass = 'bg-blue-50 dark:bg-blue-900/30';
      }

      return (
        <div className="relative inline-flex gap-2 group">
          {boxes.map(i => (
            <div key={i} className={`w-12 h-14 flex items-center justify-center text-2xl font-bold border-2 rounded-xl transition-colors duration-200 ${borderColorClass} ${bgColorClass} ${textColorClass} shadow-sm group-hover:border-blue-400`}>
              {chars[i] || ''}
            </div>
          ))}
          <input type="text" inputMode="decimal" pattern="[0-9\.\,\-]*" className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10" value={value}
            onChange={(e) => {
              const filteredValue = e.target.value.replace(/[^0-9\.\,\-]/g, '').slice(0, 4);
              onChange(filteredValue);
            }} readOnly={readOnly} autoComplete="off" />
        </div>
      );
    };

    // ================= TÁCH COMPONENT ĐỒNG HỒ ĐỂ CHỐNG GIẬT LAG KHI ĐẾM NGƯỢC =================
    const CountdownTimer = React.memo(({ initialTime, isSubmitted, handleTimeUp }) => {
        const [timeLeft, setTimeLeft] = useState(initialTime);

        useEffect(() => {
            if (initialTime <= 0 || isSubmitted) return;
            if (timeLeft <= 0) {
                handleTimeUp();
                return;
            }
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }, [timeLeft, isSubmitted, initialTime, handleTimeUp]);

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
        };

        if (initialTime <= 0 || isSubmitted) return null;

        return (
             <div className={`font-mono text-lg sm:text-xl font-black px-4 py-2 rounded-xl border-2 flex items-center gap-2 transition-colors shadow-inner tracking-widest ${timeLeft <= 60 ? 'bg-red-50 text-red-600 border-red-400 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500 animate-pulse' : 'bg-slate-800 text-emerald-400 border-slate-700 dark:bg-black dark:text-emerald-500 dark:border-slate-800'}`}>
                <Icons.Clock /> <span>{formatTime(timeLeft)}</span>
             </div>
        );
    });

    // ================= CÁC COMPONENT GIAO DIỆN CÒN LẠI =================
    
    const LoginScreen = React.memo(({ ThemeToggleBtn, Notification, handleGuestJoin, handleCodeInputChange, handleLogin }) => {
      const [showPassword, setShowPassword] = useState(false);
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors flex items-center justify-center p-4 relative">
          <div className="absolute top-4 right-4"><ThemeToggleBtn /></div>
          <Notification />
          <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-center">
              <div className="mb-8">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block whitespace-nowrap">Dành cho Người thi</span>
                <h2 className="text-3xl font-black mb-2 truncate">Vào Thi Ngay</h2>
                <p className="text-blue-100">Không cần đăng nhập. Bạn có thể nhập mã 6 ký tự hoặc dán nguyên link chia sẻ vào đây.</p>
              </div>
              <form onSubmit={handleGuestJoin} className="bg-white/10 p-2 rounded-2xl flex gap-2 border border-white/20 backdrop-blur-sm">
                <input type="text" name="shareCode" onChange={handleCodeInputChange} placeholder="Nhập mã hoặc dán link..." className="w-full min-w-0 bg-transparent px-4 py-3 text-lg sm:text-xl font-bold placeholder-blue-200 text-white outline-none" required />
                <button type="submit" className="bg-white text-blue-600 px-6 font-bold rounded-xl shadow hover:bg-slate-50 transition shrink-0 whitespace-nowrap">VÀO</button>
              </form>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center transition-colors">
              <div className="mb-6">
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block transition-colors whitespace-nowrap">Dành cho Người ra đề</span>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 truncate">Quản Lý Đề Thi</h2>
                <p className="text-slate-500 dark:text-slate-400">Đăng nhập để tạo đề, lưu trữ và lấy mã chia sẻ.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input type="text" name="username" placeholder="Tên đăng nhập" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Mật khẩu" required className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-2">
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
                <button type="submit" className="w-full bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow mt-2 flex items-center justify-center gap-2 whitespace-nowrap">
                  <Icons.User /> Đăng Nhập / Đăng Ký
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    });

    const DashboardScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, currentUser, setCurrentUser, navigate, resetQuiz, myQuizzes, db, quizzesPath, handleGuestJoin, handleCodeInputChange, handleDeleteAccount, handleChangePassword, copyToClipboard, setCustomAlert }) => {
      const [showUserMenu, setShowUserMenu] = useState(false);
      const [showChangePwd, setShowChangePwd] = useState(false);
      const now = Date.now();
      const usernameLower = currentUser?.username.toLowerCase();
      const isAdmin = usernameLower === ADMIN_USERNAME;
      const limitText = isAdmin ? "Admin Không giới hạn" : `${myQuizzes.length}/${MAX_QUIZZES_PER_USER} đề`;

      return (
        <div className="min-h-screen p-4 md:p-8 animate-fade-in bg-slate-50 dark:bg-slate-900 transition-colors">
          <Notification />
          <CustomConfirmModal />
          {showChangePwd && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <form onSubmit={(e) => { handleChangePassword(e); setShowChangePwd(false); }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
                <h3 className="text-xl font-bold mb-4 dark:text-white truncate">Đổi Mật Khẩu</h3>
                <input type="password" name="oldPassword" placeholder="Mật khẩu cũ" required className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-slate-700 outline-none" />
                <input type="password" name="newPassword" placeholder="Mật khẩu mới" required className="w-full mb-5 px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-slate-700 outline-none" />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap">Xác nhận</button>
                  <button type="button" onClick={() => setShowChangePwd(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-2 rounded-lg transition whitespace-nowrap">Hủy</button>
                </div>
              </form>
            </div>
          )}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 bg-white dark:bg-slate-800 p-4 px-4 sm:px-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 gap-4 transition-colors">
              <div className="flex justify-between items-center w-full sm:w-auto gap-3 sm:gap-4 sm:border-r border-slate-200 dark:border-slate-700 sm:pr-6">
                <div className="relative flex-1 min-w-0">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 hover:opacity-80 transition w-full text-left">
                    <Icons.User /> 
                    <span className="text-blue-600 dark:text-blue-400 truncate min-w-0">{currentUser?.username}</span> 
                    <span className="shrink-0">▾</span>
                    {isAdmin && <span className="text-[10px] sm:text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase shrink-0 shadow-sm">ADMIN</span>}
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                      <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 py-2">
                        <button onClick={() => {setShowChangePwd(true); setShowUserMenu(false);}} className="w-full text-left px-4 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition whitespace-nowrap"><Icons.Key /> Đổi mật khẩu</button>
                        {isAdmin && (
                          <button onClick={() => window.location.href = 'admin.html'} className="w-full text-left px-4 py-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold transition whitespace-nowrap"><Icons.Shield /> Quản trị Admin</button>
                        )}
                        <button onClick={() => {handleDeleteAccount(); setShowUserMenu(false);}} className="w-full text-left px-4 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium transition whitespace-nowrap"><Icons.UserX /> Xóa tài khoản</button>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ThemeToggleBtn />
                  <button onClick={() => { setCurrentUser(null); navigate('Login'); }} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-sm whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                    <Icons.Logout /> Đăng xuất
                  </button>
                </div>
              </div>
              <form onSubmit={handleGuestJoin} className="flex-1 flex gap-2 w-full mt-2 sm:mt-0 min-w-0">
                <input type="text" name="shareCode" onChange={handleCodeInputChange} placeholder="Nhập mã hoặc dán link đề..." className="w-full min-w-0 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl text-slate-800 dark:text-white font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow font-bold shrink-0 whitespace-nowrap transition">VÀO THI</button>
              </form>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white truncate">Kho đề thi của bạn</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đã lưu: {limitText}</p>
              </div>
              <button onClick={resetQuiz} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-md w-full sm:w-auto shrink-0 whitespace-nowrap">+ TẠO ĐỀ MỚI</button>
            </div>
            {myQuizzes.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 transition-colors">Chưa có đề nào.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {myQuizzes.map(q => {
                  const daysLeft = Math.ceil((q.expiresAt - now) / 86400000);
                  const fullLink = `${window.location.origin}${window.location.pathname}#/Overview/${q.code}`;

                  return (
                    <div key={q.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors flex flex-col justify-between min-w-0">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2 truncate">{q.title}</h3>
                        <div className="flex justify-between text-xs mb-4">
                          <span className="text-slate-500 dark:text-slate-400">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span className={`${daysLeft <= 5 ? "text-red-500" : "text-amber-500"} font-bold`}>Hết hạn sau {daysLeft} ngày</span>
                        </div>
                        
                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/50 min-w-0 mb-4">
                            <span className="text-blue-800 dark:text-blue-300 font-mono font-black text-lg truncate min-w-0 pl-2 tracking-widest">{q.code}</span>
                            <button onClick={() => copyToClipboard(fullLink, q.code)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold transition text-sm shrink-0 whitespace-nowrap shadow-sm">Copy Link</button>
                        </div>

                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 relative">
                        <button onClick={() => navigate(`Overview/${q.code}`)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base min-w-0 truncate">Xem / Sửa</button>
                        <button onClick={() => db.doc(`${quizzesPath}/${q.id}`).update({ expiresAt: Math.min(q.expiresAt + 7*86400000, q.createdAt + 50*86400000) })} className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 transition text-sm shrink-0 whitespace-nowrap">+7 Ngày</button>
                        <button onClick={() => {
                            setCustomAlert({
                                isOpen: true, title: "Xóa đề thi", message: "Bạn có chắc chắn muốn xóa đề thi này không?",
                                type: 'danger', confirmText: 'Xóa ngay', cancelText: 'Hủy', onConfirm: () => db.doc(`${quizzesPath}/${q.id}`).delete()
                            });
                        }} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-500 hover:text-white transition shrink-0"><Icons.Trash /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    });

    const InputScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, navigate, quizTitle, setQuizTitle, currentQuizCode, rawTexts, setRawTexts, handleParseAndSave, saveCooldown, isSaving }) => {
      const [inputTab, setInputTab] = useState('mc');
      const tabs = [{ id: 'mc', label: 'I. Trắc nghiệm' }, { id: 'tf', label: 'II. Đúng sai' }, { id: 'sa', label: 'III. Trả lời ngắn' }, { id: 'rc', label: 'IV. Đọc hiểu' }, { id: 'file', label: 'Tải File / Hỗn hợp' }];
      const placeholders = { 
      mc: "Câu 1. Nội dung...\nA. Lựa chọn 1\n*B. Lựa chọn 2(đúng)",
      tf: "Câu 2: Nội dung...\na) Mệnh đề 1\n*b) Mệnh đề 2(đúng)",
      sa: "Câu 3. Trả lời ngắn\n*4.5*",
      rc: "Câu 4. Đoạn văn...\n#1. Nội dung...\nA. Lựa chọn 1\n*B. Lựa chọn 2(đúng)\n#2. Nội dung...\n*A. Lựa chọn 1(đúng)\nB. Lựa chọn 2",
      file: "Dán hỗn hợp có cấu trúc như các phần trước hoặc file .txt. Có Phần I, Phần II..." };
      const tips = { 
      mc: 'Dùng từ \"Câu\" để xác định câu hỏi. Đáp án \"A.\", \"B.\". Mỗi câu và mỗi đáp án để theo dòng * trước câu đúng.', 
      tf: 'Cấu trúc tương tự trắc nghiệm. Thường dùng \"a)\", \"b)\".',
      sa: 'Bọc đáp án giữa 2 dấu sao *đáp án*.',
      rc: 'Cấu trúc tương tự các phần trên nhưng câu hỏi phụ dùng #1., #2.',
      file: 'Bắt buộc phải có các Phần I, II, III, IV để hệ thống tự nhận diện được.' };

      return (
        <div className="min-h-screen p-4 md:p-8 animate-fade-in bg-slate-100 dark:bg-slate-900 transition-colors">
          <Notification />
          <CustomConfirmModal />
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 min-w-0">
            <div className="flex justify-between items-start mb-6 gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white truncate">Tạo đề</h1>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <ThemeToggleBtn />
                <button onClick={() => navigate(currentQuizCode ? `Overview/${currentQuizCode}` : 'Home')} className="text-slate-500 font-bold hover:text-slate-800 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full whitespace-nowrap">Thoát</button>
              </div>
            </div>
            <div className="mb-6">
                <input type="text" placeholder="Tên Đề Thi..." value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-bold dark:text-white transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-5">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setInputTab(t.id)} 
                  className={`px-4 py-3 font-bold rounded-[18px] transition-all text-sm md:text-base ${inputTab === t.id ? (t.id === 'file' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-blue-600 text-white') : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'} ${t.id === 'file' ? 'col-span-2' : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">💡 <b>Mẹo:</b> {tips[inputTab]}</p>
              {inputTab === 'file' && (
                <label className="cursor-pointer bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0 transition">
                  <Icons.Upload /> Chọn file .txt
                  <input type="file" accept=".txt" className="hidden" onChange={(e) => {
                    const file = e.target.files[0]; if(!file) return;
                    const reader = new FileReader(); reader.onload = (evt) => setRawTexts({...rawTexts, file: evt.target.result});
                    reader.readAsText(file);
                  }} />
                </label>
              )}
            </div>
            <textarea className="w-full h-[350px] p-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 outline-none resize-none font-mono text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white transition-colors mb-6" 
              placeholder={placeholders[inputTab]} value={rawTexts[inputTab]} onChange={(e) => setRawTexts({...rawTexts, [inputTab]: e.target.value})} />
            <div className="flex gap-4">
              <button onClick={saveCooldown > 0 || isSaving ? null : handleParseAndSave} disabled={saveCooldown > 0 || isSaving}
                className={`flex-1 ${saveCooldown > 0 || isSaving ? 'bg-slate-400 dark:bg-slate-600' : 'bg-green-600 hover:bg-green-700'} text-white font-black text-lg py-4 rounded-2xl shadow-lg transition flex justify-center items-center gap-2 transform ${saveCooldown > 0 || isSaving ? '' : 'hover:-translate-y-1'}`}
              >
                {isSaving ? "ĐANG LƯU..." : saveCooldown > 0 ? `ĐỢI (${saveCooldown}s)` : <><Icons.Check /> LƯU</>}
              </button>
            </div>
          </div>
        </div>
      );
    });

    const OverviewScreen = React.memo(({ ThemeToggleBtn, Notification, quizTitle, timeLimit, setTimeLimit, currentQuizCode, copyToClipboard, config, setConfig, prepareQuiz, isReadOnly, navigate, cloneQuizAdmin, currentUser }) => {
      const [showShuffleMenu, setShowShuffleMenu] = useState(false);
      const [showHourMenu, setShowHourMenu] = useState(false);
      const [showMinuteMenu, setShowMinuteMenu] = useState(false);
      const [showSecondMenu, setShowSecondMenu] = useState(false);

      const isAdmin = currentUser?.username.toLowerCase() === ADMIN_USERNAME;
      const shuffleOptions = [
          { id: 'none', label: 'Giữ nguyên thứ tự' },
          { id: 'questions', label: 'Chỉ trộn câu hỏi' },
          { id: 'options', label: 'Chỉ trộn đáp án' },
          { id: 'both', label: 'Trộn tất cả' }
      ];
      const fullLink = `${window.location.origin}${window.location.pathname}#/Overview/${currentQuizCode}`;

      // Tính toán giá trị giờ, phút, giây từ state timeLimit (tổng số giây)
      const currentSeconds = parseInt(timeLimit) || 0;
      const h = Math.floor(currentSeconds / 3600);
      const m = Math.floor((currentSeconds % 3600) / 60);
      const s = currentSeconds % 60;

      const updateTime = (type, val) => {
          const num = parseInt(val) || 0;
          let newH = h, newM = m, newS = s;
          if (type === 'h') newH = num;
          if (type === 'm') newM = num;
          if (type === 's') newS = num;
          setTimeLimit(newH * 3600 + newM * 60 + newS);
      };

      return (
        <div className="min-h-screen p-4 md:p-8 animate-fade-in bg-slate-100 dark:bg-slate-900 transition-colors flex items-center justify-center">
          <Notification />
          <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 min-w-0">
              <div className="flex flex-col mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 gap-2">
                  <div className="flex justify-between items-start">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white line-clamp-2">{quizTitle || "Đề thi"}</h2>
                      <ThemeToggleBtn />
                  </div>
                  {currentQuizCode && (
                      <div className="flex justify-end">
                          <div onClick={() => copyToClipboard(fullLink, currentQuizCode)} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition text-sm">
                              Mã: <span className="tracking-widest">{currentQuizCode}</span> <Icons.Copy />
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="flex flex-col items-center mb-8 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                {/* 1. CHẾ ĐỘ THI */}
                <div className="w-full flex flex-col items-center border-b border-slate-100 dark:border-slate-700 pb-6">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Chế độ thi</p>
                  <div className="flex w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 gap-1.5 border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setConfig({...config, mode: 'single'})} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${config.mode === 'single' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Từng câu</button>
                    <button onClick={() => setConfig({...config, mode: 'all'})} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${config.mode === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Tất cả</button>
                  </div>
                </div>
                
                {/* 2. XÁO TRỘN */}
                <div className="w-full flex flex-col items-center relative border-b border-slate-100 dark:border-slate-700 py-6">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Xáo trộn</p>
                  <div className="w-full">
                      <button 
                          onClick={() => setShowShuffleMenu(!showShuffleMenu)} 
                          className="w-full flex items-center justify-between py-4 px-5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm"
                      >
                          <span className="truncate">{shuffleOptions.find(o => o.id === config.shuffle)?.label || 'Giữ nguyên'}</span>
                          <div className={`transition-transform duration-200 text-slate-400 ${showShuffleMenu ? 'rotate-180' : ''}`}>
                              <Icons.ChevronDown />
                          </div>
                      </button>

                      {showShuffleMenu && (
                          <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowShuffleMenu(false)}></div>
                              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                                  {shuffleOptions.map(opt => (
                                      <button 
                                          key={opt.id} 
                                          onClick={() => {
                                              setConfig({...config, shuffle: opt.id});
                                              setShowShuffleMenu(false);
                                          }}
                                          className={`w-full text-left px-5 py-4 font-bold transition-colors ${config.shuffle === opt.id ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                      >
                                          {opt.label}
                                      </button>
                                  ))}
                              </div>
                          </>
                      )}
                  </div>
                </div>

                {/* 3. THỜI GIAN LÀM BÀI BẰNG DROPDOWN */}
                <div className="w-full flex flex-col items-center relative pt-6">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Thời gian làm bài</p>
                  <div className="flex w-full gap-2 sm:gap-4">
                     <div className="relative flex-1">
                         <button onClick={() => setShowHourMenu(!showHourMenu)} className="w-full flex items-center justify-between py-3.5 px-3 sm:px-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm text-xs sm:text-sm">
                             <span className="truncate">{h} Giờ</span>
                             <div className={`transition-transform duration-200 text-slate-400 ${showHourMenu ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
                         </button>
                         {showHourMenu && (
                             <>
                                 <div className="fixed inset-0 z-40" onClick={() => setShowHourMenu(false)}></div>
                                 <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
                                     <button onClick={() => { updateTime('h', 0); setShowHourMenu(false); }} className={`w-full text-center px-2 py-3 font-bold transition-colors text-xs sm:text-sm ${h === 0 ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>0 Giờ</button>
                                     {[...Array(12)].map((_, i) => <button key={i+1} onClick={() => { updateTime('h', i+1); setShowHourMenu(false); }} className={`w-full text-center px-2 py-3 font-bold transition-colors text-xs sm:text-sm ${h === i+1 ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{i+1} Giờ</button>)}
                                 </div>
                             </>
                         )}
                     </div>
                     <div className="relative flex-1">
                         <button onClick={() => setShowMinuteMenu(!showMinuteMenu)} className="w-full flex items-center justify-between py-3.5 px-3 sm:px-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm text-xs sm:text-sm">
                             <span className="truncate">{m} Phút</span>
                             <div className={`transition-transform duration-200 text-slate-400 ${showMinuteMenu ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
                         </button>
                         {showMinuteMenu && (
                             <>
                                 <div className="fixed inset-0 z-40" onClick={() => setShowMinuteMenu(false)}></div>
                                 <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
                                     <button onClick={() => { updateTime('m', 0); setShowMinuteMenu(false); }} className={`w-full text-center px-2 py-3 font-bold transition-colors text-xs sm:text-sm ${m === 0 ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>0 Phút</button>
                                     {[...Array(59)].map((_, i) => <button key={i+1} onClick={() => { updateTime('m', i+1); setShowMinuteMenu(false); }} className={`w-full text-center px-2 py-3 font-bold transition-colors text-xs sm:text-sm ${m === i+1 ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{i+1} Phút</button>)}
                                 </div>
                             </>
                         )}
                     </div>
                     <div className="relative flex-1">
                         <button onClick={() => setShowSecondMenu(!showSecondMenu)} className="w-full flex items-center justify-between py-3.5 px-3 sm:px-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm text-xs sm:text-sm">
                             <span className="truncate">{s} Giây</span>
                             <div className={`transition-transform duration-200 text-slate-400 ${showSecondMenu ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
                         </button>
                         {showSecondMenu && (
                             <>
                                 <div className="fixed inset-0 z-40" onClick={() => setShowSecondMenu(false)}></div>
                                 <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
                                     <button onClick={() => { updateTime('s', 0); setShowSecondMenu(false); }} className={`w-full text-center px-2 py-3 font-bold transition-colors text-xs sm:text-sm ${s === 0 ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>0 Giây</button>
                                     {[...Array(59)].map((_, i) => <button key={i+1} onClick={() => { updateTime('s', i+1); setShowSecondMenu(false); }} className={`w-full text-center px-2 py-3 font-bold transition-colors text-xs sm:text-sm ${s === i+1 ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{i+1} Giây</button>)}
                                 </div>
                             </>
                         )}
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={prepareQuiz} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-lg transform hover:-translate-y-1"><Icons.Play /> BẮT ĐẦU THI</button>
                {!isReadOnly && (
                  <div className="flex gap-3">
                      <button onClick={() => navigate(`Overview/${currentQuizCode}/EditText`)} className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow transition text-sm">Sửa Text Gốc</button>
                      <button onClick={() => navigate(`Overview/${currentQuizCode}/EditQuestion`)} className="flex-1 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow transition text-sm">Sửa Câu Hỏi</button>
                  </div>
                )}
                {isReadOnly && isAdmin && (
                      <button onClick={() => cloneQuizAdmin()} className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-4 rounded-xl transition shadow flex items-center justify-center gap-2"><Icons.Copy /> Nhân bản thành đề của tôi (Admin)</button>
                )}
                <button onClick={() => navigate(currentUser ? 'Home' : 'Login')} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold py-4 rounded-xl border border-slate-200 dark:border-slate-700 transition">Thoát</button>
              </div>
          </div>
        </div>
      );
    });

    const SettingsScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, parsedData, setParsedData, editingQ, setEditingQ, navigate, currentQuizCode, isReadOnly, currentUser, db, handleImageUpload, changeQuestionType, saveInlineEdit, removeInlineQuestion, handleAddNewQuestion, showMessage, quizzesPath }) => {
      const [qSearchTerm, setQSearchTerm] = useState('');
      const [showTypeMenu, setShowTypeMenu] = useState(false);
      const [showAddSectionSelector, setShowAddSectionSelector] = useState(false);

      // Kỹ thuật tự động co giãn chiều cao của Textarea
      const handleTextareaChange = (e, callback) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
          callback(e.target.value);
      };
      
      const autoResizeRef = useCallback((node) => {
          if (node) {
              node.style.height = 'auto';
              node.style.height = node.scrollHeight + 'px';
          }
      }, []);

      const sections = useMemo(() => [
        { id: 'mc', title: 'Phần I: Trắc Nghiệm', data: (parsedData.mc || []).map((q, i) => ({...q, originalIndex: i + 1})) },
        { id: 'tf', title: 'Phần II: Đúng/Sai', data: (parsedData.tf || []).map((q, i) => ({...q, originalIndex: i + 1})) },
        { id: 'sa', title: 'Phần III: Trả lời ngắn', data: (parsedData.sa || []).map((q, i) => ({...q, originalIndex: i + 1})) },
        { id: 'rc', title: 'Phần IV: Đọc hiểu / Nhóm', data: (parsedData.rc || []).map((q, i) => ({...q, originalIndex: i + 1})) }
      ], [parsedData]);

      const questionTypeOptions = [
          { id: 'mc', label: 'I. Trắc nghiệm' },
          { id: 'tf', label: 'II. Đúng / Sai' },
          { id: 'sa', label: 'III. Trả lời ngắn' },
          { id: 'rc', label: 'IV. Đọc hiểu / Nhóm' }
      ];

      const filteredSections = useMemo(() => {
          return sections.map(sec => ({
              ...sec,
              data: sec.data.filter((q) => {
                  if (!q) return false;
                  const term = qSearchTerm.toLowerCase().trim();
                  const qIndexStr = q.originalIndex.toString();
                  const qIndexFullStr = `câu ${q.originalIndex}`;
                  
                  const textMatch = (q.text || '').toLowerCase().includes(term);
                  const indexMatch = qIndexStr === term || qIndexFullStr.includes(term) || qIndexStr.includes(term);
                  const optionsMatch = q.options && q.options.some(opt => opt && (opt.text || '').toLowerCase().includes(term));
                  const subQuestionsMatch = q.subQuestions && q.subQuestions.some(sq => 
                      sq && (
                          (sq.text || '').toLowerCase().includes(term) || 
                          (sq.options && sq.options.some(opt => opt && (opt.text || '').toLowerCase().includes(term)))
                      )
                  );
                  
                  return textMatch || indexMatch || optionsMatch || subQuestionsMatch;
              })
          })).filter(sec => sec.data.length > 0);
      }, [sections, qSearchTerm]);

      return (
        <div className="min-h-screen p-4 md:p-8 animate-fade-in bg-slate-100 dark:bg-slate-900 transition-colors">
          <Notification />
          <CustomConfirmModal />
          {editingQ && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto pb-10">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in border dark:border-slate-700">
                <h3 className="text-2xl font-black mb-4 dark:text-white">{editingQ.isNew ? 'Thêm câu hỏi' : 'Sửa câu hỏi'}</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <button 
                        onClick={() => setShowTypeMenu(!showTypeMenu)} 
                        className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-xl font-bold border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm"
                    >
                        <span>{questionTypeOptions.find(t => t.id === editingQ.data.type)?.label || 'Chọn loại'}</span>
                        <div className={`transition-transform duration-200 text-slate-400 ${showTypeMenu ? 'rotate-180' : ''}`}>
                            <Icons.ChevronDown />
                        </div>
                    </button>

                    {showTypeMenu && (
                        <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setShowTypeMenu(false)}></div>
                            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[70] overflow-hidden animate-fade-in">
                                {questionTypeOptions.map(opt => (
                                    <button 
                                        key={opt.id} 
                                        onClick={() => {
                                            changeQuestionType(opt.id);
                                            setShowTypeMenu(false);
                                        }}
                                        className={`w-full text-left px-5 py-4 font-bold transition-colors ${editingQ.data.type === opt.id ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                  </div>
                  <div>
                    <textarea 
                        value={editingQ.data.text} 
                        ref={autoResizeRef}
                        onChange={e => handleTextareaChange(e, val => setEditingQ({...editingQ, data: {...editingQ.data, text: val}}))} 
                        className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white dark:border-slate-600 outline-none resize-none overflow-hidden" 
                        rows="1" 
                    />
                  </div>
                  {editingQ.data.type !== 'rc' && (
                    <div>
                      {editingQ.data.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-start gap-3 mb-2">
                          {editingQ.data.type !== 'sa' && <input type="radio" checked={opt.isCorrect} onChange={() => {
                            const newOpts = editingQ.data.options.map(o => ({...o, isCorrect: o.id === opt.id}));
                            setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                          }} className="mt-3 w-5 h-5 text-blue-600 cursor-pointer" />}
                          <textarea 
                              value={opt.text} 
                              ref={autoResizeRef}
                              onChange={e => handleTextareaChange(e, val => {
                                const newOpts = [...editingQ.data.options]; newOpts[oIdx].text = val;
                                setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                              })} 
                              className="flex-1 p-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-slate-600 outline-none resize-none overflow-hidden" 
                              rows="1" 
                          />
                          <button onClick={() => {
                              const newOpts = editingQ.data.options.filter(o => o.id !== opt.id);
                              setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                          }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><Icons.Trash /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const newOpts = [...editingQ.data.options, {id: generateId(), text: '', isCorrect: editingQ.data.options.length === 0}];
                        setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                      }} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold transition">+ Đáp án</button>
                    </div>
                  )}
                  {editingQ.data.type === 'rc' && (
                    <div className="space-y-4">
                      {editingQ.data.subQuestions.map((sq, sqIdx) => (
                        <div key={sq.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 relative">
                            <button onClick={() => {
                              const newSqs = editingQ.data.subQuestions.filter(s => s.id !== sq.id);
                              setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                          }} className="absolute top-2 right-2 text-red-500 text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded border shadow-sm hover:bg-red-50 transition">Xóa câu phụ</button>

                          <textarea 
                              value={sq.text} 
                              ref={autoResizeRef}
                              onChange={e => handleTextareaChange(e, val => {
                                  const newSqs = [...editingQ.data.subQuestions]; newSqs[sqIdx].text = val;
                                  setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                              })} 
                              className="w-full pr-20 p-2 mb-2 border rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-600 font-bold outline-none resize-none overflow-hidden" 
                              rows="1" 
                          />
                          {sq.options.map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-start gap-2 mb-2 pl-2">
                              <input type="radio" checked={opt.isCorrect} onChange={() => {
                                  const newSqs = [...editingQ.data.subQuestions];
                                  newSqs[sqIdx].options = sq.options.map(o => ({...o, isCorrect: o.id === opt.id}));
                                  setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                              }} className="mt-1 w-4 h-4 text-blue-600 cursor-pointer" />
                              <textarea 
                                  value={opt.text} 
                                  ref={autoResizeRef}
                                  onChange={e => handleTextareaChange(e, val => {
                                      const newSqs = [...editingQ.data.subQuestions];
                                      newSqs[sqIdx].options[oIdx].text = val;
                                      setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                                  })} 
                                  className="flex-1 text-sm p-1.5 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600 outline-none resize-none overflow-hidden" 
                                  rows="1" 
                              />
                                <button onClick={() => {
                                  const newSqs = [...editingQ.data.subQuestions];
                                  newSqs[sqIdx].options = newSqs[sqIdx].options.filter(o => o.id !== opt.id);
                                  setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                              }} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded shrink-0"><Icons.Trash /></button>
                            </div>
                          ))}
                          <button onClick={() => {
                              const newSqs = [...editingQ.data.subQuestions];
                              newSqs[sqIdx].options.push({id: generateId(), text: '', isCorrect: newSqs[sqIdx].options.length === 0});
                              setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                          }} className="text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-bold ml-6 mt-1">+ Thêm đáp án</button>
                        </div>
                      ))}
                      <button onClick={() => {
                          const newSqs = [...editingQ.data.subQuestions, {id: generateId(), text: 'Câu phụ mới', options: []}];
                          setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                      }} className="text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-bold w-full transition">+ Câu hỏi phụ</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-6 border-t dark:border-slate-700 pt-4">
                  <button onClick={saveInlineEdit} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl shadow hover:bg-green-700 transition">Lưu Thay Đổi</button>
                  {!editingQ.isNew && <button onClick={removeInlineQuestion} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl shadow hover:bg-red-700 transition">Xóa Câu Này</button>}
                  <button onClick={() => setEditingQ(null)} className="w-full sm:flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition">Hủy</button>
                </div>
              </div>
            </div>
          )}
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                  <button onClick={() => navigate(`Overview/${currentQuizCode}`)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition"><Icons.ArrowLeft /></button>
                  <h2 className="text-xl sm:text-2xl font-black dark:text-white truncate">Chi tiết câu hỏi</h2>
              </div>
              <div className="flex w-full md:w-auto gap-3 flex-1 md:justify-end">
                  <div className="relative w-full max-w-sm">
                      <input type="text" placeholder="Tìm số hoặc tên câu..." value={qSearchTerm} onChange={(e) => setQSearchTerm(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium dark:text-white transition-colors" />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
                  </div>
                  {!isReadOnly && (
                  <>
                  <button onClick={() => {
                      if (currentUser && currentQuizCode && db) {
                          db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: parsedData })
                          .then(() => showMessage("Đã lưu đề thi thành công!", "success"))
                          .catch(() => showMessage("Lỗi khi lưu đề thi!", "error"));
                      } else {
                          showMessage("Đã lưu trên máy (chưa đồng bộ lên Cloud)!", "success");
                      }
                  }} className="flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition px-4 py-2.5 rounded-xl font-bold text-sm shrink-0">
                      <Icons.Check /> <span className="hidden sm:inline">Lưu</span>
                  </button>
                  <button onClick={() => setShowAddSectionSelector(true)} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition px-4 py-2.5 rounded-xl font-bold text-sm shrink-0">
                      <Icons.Plus /> <span className="hidden sm:inline">Thêm</span>
                  </button>
                  </>
                  )}
              </div>
            </div>
            {filteredSections.length === 0 ? <div className="text-center text-slate-400 py-10">Không tìm thấy câu hỏi nào.</div> : filteredSections.map(section => (
              <div key={section.id} className="mb-10 min-w-0">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 px-4 py-2 rounded-lg mb-4 inline-block truncate max-w-full">{section.title}</h3>
                <div className="space-y-4">
                  {section.data.map((q, idx) => (
                    <div key={q.id} className="border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-600 transition-colors relative min-w-0">
                      {!isReadOnly && <button onClick={() => setEditingQ({ sectionId: section.id, data: JSON.parse(JSON.stringify(q)), isNew: false, oldSectionId: section.id })} className="absolute top-4 right-4 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 transition px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Icons.Edit /> Sửa</button>}
                      <div className="flex-1 pr-16 md:pr-20 min-w-0">
                        <div className="font-black text-slate-700 dark:text-slate-300 mb-1">Câu {q.originalIndex}:</div>
                        <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-medium break-words">{q.text}</div>
                        {(q.type === 'mc' || q.type === 'tf') && (
                            <div className="mt-3 space-y-1.5 pl-2 sm:pl-3 border-l-2 border-slate-100 dark:border-slate-700">
                                {q.options.map(opt => <div key={opt.id} className={`text-sm flex items-start gap-2 ${opt.isCorrect ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}><span className="shrink-0 pt-0.5">{opt.isCorrect ? '✓' : '○'}</span><span className="break-words whitespace-pre-wrap">{opt.text}</span></div>)}
                            </div>
                        )}
                        {!isReadOnly && q.type === 'sa' && <div className="text-sm text-green-700 dark:text-green-400 mt-2 font-bold bg-green-50 dark:bg-green-900/30 p-2 rounded inline-block break-words border border-green-100 dark:border-green-800 whitespace-pre-wrap">Đ.án: {q.options[0]?.text || '(Chưa nhập)'}</div>}
                        {q.type === 'rc' && (
                          <div className="mt-4 space-y-3 pl-4 border-l-4 border-slate-200 dark:border-slate-600 min-w-0">
                            {q.subQuestions.map((sq, sIdx) => (
                              <div key={sq.id} className="min-w-0">
                                <div className="font-bold text-slate-600 dark:text-slate-400 break-words whitespace-pre-wrap">#{sIdx + 1}: {sq.text}</div>
                                {!isReadOnly && sq.options.filter(o=>o.isCorrect).map(o => <div key={o.id} className="text-sm text-green-600 dark:text-green-400 font-medium inline-block mr-2 break-words whitespace-pre-wrap">Đ.án: {o.text}</div>)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="w-full md:w-auto shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                        {q.image ? (
                            <div className="relative inline-block">
                              <img src={q.image} loading="lazy" className="h-28 w-auto object-contain rounded" />
                              {!isReadOnly && <button onClick={() => { const newData = {...parsedData}; newData[section.id].find(x => x.id === q.id).image = null; setParsedData(newData); if (currentUser && currentQuizCode && db) db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: newData }); }} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow hover:bg-red-600 shrink-0">×</button>}
                            </div>
                        ) : (
                            !isReadOnly ? (
                            <label className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-sm py-4 px-6 flex flex-col items-center gap-1 transition whitespace-nowrap">
                              <Icons.Image /> Thêm ảnh
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(q.id, section.id, e.target.files[0])} />
                            </label>
                          ) : <span className="text-slate-400 text-sm px-4 whitespace-nowrap">Không ảnh</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {showAddSectionSelector && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm border dark:border-slate-700 animate-bounce-in">
                  <h3 className="text-xl font-black mb-4 text-center dark:text-white">Thêm vào phần nào?</h3>
                  <div className="space-y-3">
                      {sections.map(s => <button key={s.id} onClick={() => handleAddNewQuestion(s.id)} className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-bold dark:text-white border dark:border-slate-700 transition">{s.title}</button>)}
                  </div>
                  <button onClick={() => setShowAddSectionSelector(false)} className="w-full mt-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition font-bold rounded-xl dark:text-white">Hủy</button>
                </div>
            </div>
          )}
        </div>
      );
    });

    const QuizScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, activeQuiz, answers, setAnswers, currentIndex, setCurrentIndex, isSubmitted, setIsSubmitted, singleQuestionConfirmed, setSingleQuestionConfirmed, score, setScore, endRemark, setEndRemark, navigate, currentQuizCode, currentUser, config, checkQuestionCorrect, generateRandomRemark, showMessage, timeLimit, setCustomAlert }) => {
      const isModeSingle = config.mode === 'single';
      const totalQ = score.total;
      const mcLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      
      const initialTime = parseInt(timeLimit) || 0;

      // Hàm xử lý khi Hết Giờ
      const handleTimeUp = useCallback(() => {
        showMessage('Hết thời gian làm bài!', 'warning');
        let correct = 0;
        activeQuiz.flat.forEach(q => {
          if(q.type === 'rc') {
            q.subQuestions.forEach(sq => { if(checkQuestionCorrect('rc', sq, answers[sq.id])) correct++; })
          } else {
            if(checkQuestionCorrect(q.type, q, answers[q.id])) correct++;
          }
        });
        setScore({ correct, total: totalQ });
        setEndRemark(generateRandomRemark(correct, totalQ));
        setIsSubmitted(true);
        setSingleQuestionConfirmed(true);
        if (isModeSingle) {
           navigate(`Overview/${currentQuizCode || 'draft'}/Result`);
        } else {
           window.scrollTo(0,0);
        }
      }, [activeQuiz, answers, totalQ, isModeSingle, navigate, currentQuizCode, checkQuestionCorrect, generateRandomRemark, showMessage, setScore, setEndRemark, setIsSubmitted, setSingleQuestionConfirmed]);

      const getOptClass = (opt, isSelected, showResult) => {
        if (!showResult) return isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200';
        if (opt.isCorrect && isSelected) return 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300';
        if (opt.isCorrect && !isSelected) return 'bg-white dark:bg-slate-800 border-green-500 border-dashed text-green-700 dark:text-green-400';
        if (!opt.isCorrect && isSelected) return 'bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-300';
        return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50 text-slate-800 dark:text-slate-200';
      };

      const renderOptions = (type, qObj, isConfirming) => {
          if (type === 'sa') {
            return (
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl min-w-0 transition-colors">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase truncate">Nhập đáp án:</p>
                <ShortAnswerInput value={answers[qObj.id] || ''} onChange={(v) => !isConfirming && setAnswers({...answers, [qObj.id]: v})} readOnly={isConfirming} showResult={isConfirming} isCorrect={isConfirming ? checkQuestionCorrect('sa', qObj, answers[qObj.id]) : null} />
                {isConfirming && !checkQuestionCorrect('sa', qObj, answers[qObj.id]) && <div className="mt-4 p-2 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 font-bold rounded-lg text-sm border border-green-200 dark:border-green-800 break-words whitespace-pre-wrap">Đáp án đúng: {qObj.options[0]?.text || '(Chưa có đáp án)'}</div>}
              </div>
            );
          }
          return (
            <div className="grid gap-3 min-w-0">
              {qObj.options.map((opt, oIdx) => {
                const isSelected = (answers[qObj.id] || []).includes(opt.id);
                return (
                  <label key={opt.id} className={`flex items-start p-4 border-2 rounded-xl transition cursor-pointer min-w-0 ${getOptClass(opt, isSelected, isConfirming)}`} 
                    onClick={() => {
                      if (isConfirming) return;
                      let newSelected = answers[qObj.id] || [];
                      if (type === 'mc' || type === 'rc') newSelected = [opt.id]; 
                      else newSelected = newSelected.includes(opt.id) ? newSelected.filter(id => id !== opt.id) : [...newSelected, opt.id]; 
                      setAnswers({...answers, [qObj.id]: newSelected});
                    }}>
                    <input type={type==='tf'?"checkbox":"radio"} checked={isSelected} readOnly className={`mt-1 w-5 h-5 shrink-0 ${type==='tf'?'rounded text-indigo-600':'text-blue-600'}`} />
                    <div className="ml-3 font-medium text-lg whitespace-pre-wrap break-words min-w-0"><span className="font-bold mr-2">{type==='tf' ? String.fromCharCode(97+oIdx)+')' : mcLetters[oIdx]+'.'}</span>{opt.text}</div>
                  </label>
                )
              })}
            </div>
          );
      }

      const confirmSingle = () => {
        const q = activeQuiz.flat[currentIndex];
        let isCorrectThisTime = 0;
        if (q.type === 'rc') {
          for (let sq of q.subQuestions) if (!answers[sq.id] || answers[sq.id].length === 0) return showMessage('Vui lòng làm hết!');
          q.subQuestions.forEach(sq => { if(checkQuestionCorrect('rc', sq, answers[sq.id])) isCorrectThisTime++; });
          setScore(p => ({ ...p, correct: p.correct + isCorrectThisTime }));
        } else {
          const ans = answers[q.id];
          if (!ans || (Array.isArray(ans) && ans.length===0) || (typeof ans==='string' && !ans.trim())) return showMessage('Chưa chọn đáp án!');
          if (checkQuestionCorrect(q.type, q, ans)) { isCorrectThisTime = 1; setScore(p => ({ ...p, correct: p.correct + 1 })); }
        }
        setSingleQuestionConfirmed(true);
        if (currentIndex === activeQuiz.flat.length - 1) setEndRemark(generateRandomRemark(score.correct + isCorrectThisTime, totalQ));
      };

      const submitAll = () => {
        let hasUnanswered = false;
        activeQuiz.flat.forEach(q => {
          if(q.type === 'rc') { q.subQuestions.forEach(sq => { if(!answers[sq.id] || answers[sq.id].length===0) hasUnanswered = true; }) }
          else { const ans = answers[q.id]; if(!ans || (Array.isArray(ans)&&ans.length===0) || (typeof ans==='string'&&!ans.trim())) hasUnanswered = true; }
        });
        if (hasUnanswered) return showMessage('Bạn còn câu chưa làm!');
        let correct = 0;
        activeQuiz.flat.forEach(q => {
          if(q.type === 'rc') { q.subQuestions.forEach(sq => { if(checkQuestionCorrect('rc', sq, answers[sq.id])) correct++; }) }
          else { if(checkQuestionCorrect(q.type, q, answers[q.id])) correct++; }
        });
        setScore({ correct, total: totalQ });
        setEndRemark(generateRandomRemark(correct, totalQ));
        setIsSubmitted(true);
        window.scrollTo(0,0);
      };

      let answeredCount = 0;
      if (isModeSingle) {
          let rcCountBefore = 0;
          for(let i=0; i<currentIndex; i++) {
              if(activeQuiz.flat[i].type === 'rc') rcCountBefore += activeQuiz.flat[i].subQuestions.length;
              else rcCountBefore++;
          }
          let currentQWeight = activeQuiz.flat[currentIndex]?.type === 'rc' ? activeQuiz.flat[currentIndex].subQuestions.length : 1;
          answeredCount = rcCountBefore + (singleQuestionConfirmed ? currentQWeight : 0);
      } else {
          let count = 0;
          activeQuiz.flat.forEach(q => {
            if (q.type === 'rc') { q.subQuestions.forEach(sq => { if (answers[sq.id] && answers[sq.id].length > 0) count++; }); } 
            else { const ans = answers[q.id]; if (ans && ((Array.isArray(ans) && ans.length > 0) || (typeof ans === 'string' && ans.trim()))) count++; }
          });
          answeredCount = count;
      }
      const progressPercent = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20 animate-fade-in transition-colors">
          <Notification />
          <CustomConfirmModal />
          <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors">
            <div className="max-w-4xl mx-auto flex items-center justify-between p-4 min-w-0 gap-2">
              <div className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors text-sm md:text-base whitespace-nowrap truncate min-w-0">Tiến độ: <span className="text-blue-600 dark:text-blue-400">{answeredCount}</span> / {totalQ}</div>
              
              {/* COMPONENT ĐỒNG HỒ ĐƯỢC TÁCH RA */}
              <CountdownTimer initialTime={initialTime} isSubmitted={isSubmitted} handleTimeUp={handleTimeUp} />

              <div className="flex items-center gap-3 shrink-0">
                <ThemeToggleBtn />
                <button onClick={() => { setCustomAlert({ isOpen: true, title: "CẢNH BÁO", message: "Thoát sẽ mất kết quả?", type: 'warning', confirmText: 'Vẫn thoát', cancelText: 'Hủy', onConfirm: () => navigate(`Overview/${currentQuizCode || ''}`) }); }} className="font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:text-red-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">Thoát</button>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700"><div className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div></div>
          </div>
          <div className="max-w-3xl mx-auto mt-8 px-4 min-w-0">
            {isModeSingle ? (() => {
              const q = activeQuiz.flat[currentIndex];
              if (!q) return (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 text-center animate-fade-in border border-slate-200 dark:border-slate-700 transition-colors">
                      <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-4">Đề thi chưa có câu hỏi nào.</p>
                      <button onClick={() => navigate(`Overview/${currentQuizCode || ''}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition">Quay lại</button>
                  </div>
              );
              return (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 md:p-10 animate-fade-in border border-slate-200 dark:border-slate-700 transition-colors min-w-0">
                  <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black px-3 py-1 rounded-full uppercase mb-4 inline-block whitespace-nowrap truncate min-w-0">Câu {currentIndex+1}</span>
                  <div className="text-xl font-medium text-slate-800 dark:text-white mb-6 whitespace-pre-wrap break-words min-w-0">{q.text}</div>
                  {q.image && <img src={q.image} loading="lazy" className="max-w-full rounded-xl mb-6 shadow" />}
                  {q.type !== 'rc' ? renderOptions(q.type, q, singleQuestionConfirmed) : (
                    <div className="space-y-6 min-w-0">
                      {q.subQuestions.map((sq, idx) => (
                        <div key={sq.id} className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors min-w-0">
                          <p className="font-bold mb-4 text-slate-800 dark:text-slate-200 break-words whitespace-pre-wrap">#{idx+1}: {sq.text}</p>
                          {renderOptions('rc', sq, singleQuestionConfirmed)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 min-w-0">
                    {!singleQuestionConfirmed ? (
                      <button onClick={confirmSingle} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-8 rounded-xl shadow-lg w-full md:w-auto transform hover:-translate-y-1 transition truncate min-w-0">XÁC NHẬN</button>
                    ) : (
                      <button onClick={() => currentIndex < activeQuiz.flat.length - 1 ? (setCurrentIndex(p=>p+1), setSingleQuestionConfirmed(false)) : navigate(`Overview/${currentQuizCode || 'draft'}/Result`)} className="bg-green-600 hover:bg-green-700 text-white font-black py-3.5 px-8 rounded-xl shadow-lg w-full md:w-auto flex items-center justify-center gap-2 transition truncate min-w-0">
                        {currentIndex < activeQuiz.flat.length - 1 ? 'CÂU TIẾP THEO' : 'XEM KẾT QUẢ'} <Icons.Check />
                      </button>
                    )}
                  </div>
                </div>
              )
            })() : (
              <div className="space-y-8 pb-10 min-w-0">
                {isSubmitted && (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border-4 border-green-500 p-8 text-center animate-fade-in relative overflow-hidden transition-colors min-w-0">
                    <div className="absolute top-0 left-0 w-full bg-green-500 text-white font-bold py-1 text-sm uppercase whitespace-nowrap min-w-0 truncate">Hoàn thành</div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-4 mb-2 truncate min-w-0">ĐIỂM CỦA BẠN</h2>
                    <div className="text-7xl font-black text-green-600 dark:text-green-400 mb-6 truncate min-w-0">{score.correct} <span className="text-4xl text-slate-300 dark:text-slate-600">/ {totalQ}</span></div>
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800/50 inline-block max-w-full min-w-0">
                       <p className="text-lg font-bold text-amber-800 dark:text-amber-400 italic break-words">"{endRemark}"</p>
                    </div>
                    <br/>
                    <button onClick={() => navigate(currentUser ? 'Home' : 'Login')} className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition shadow truncate min-w-0">Về Trang Chủ</button>
                  </div>
                )}
                {['mc', 'tf', 'sa', 'rc'].map(type => {
                  const data = activeQuiz[type]; if(data.length === 0) return null;
                  const typeName = type === 'mc' ? 'I. Trắc Nghiệm' : type === 'tf' ? 'II. Đúng / Sai' : type === 'sa' ? 'III. Trả Lời Ngắn' : 'IV. Đọc Hiểu';
                  return (
                    <div key={type} className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors min-w-0">
                      <div className="bg-indigo-600 dark:bg-indigo-700 p-4 min-w-0"><h2 className="text-xl font-black text-white truncate min-w-0">{typeName}</h2></div>
                      <div className="p-6 md:p-8 space-y-10 min-w-0">
                        {data.map((q, idx) => (
                          <div key={q.id} className="border-b-2 border-dashed border-slate-200 dark:border-slate-700 last:border-0 pb-10 last:pb-0 min-w-0">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4 whitespace-pre-wrap break-words min-w-0"><span className="font-black mr-2 text-indigo-600 dark:text-indigo-400">Câu {idx + 1}.</span> {q.text}</h3>
                            {q.image && <img src={q.image} loading="lazy" className="max-w-full rounded-xl mb-6 shadow" />}
                            {type !== 'rc' ? renderOptions(type, q, isSubmitted) : (
                              <div className="space-y-6 min-w-0">
                                {q.subQuestions.map((sq, sIdx) => (
                                  <div key={sq.id} className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-4 break-words whitespace-pre-wrap">#{sIdx+1}: {sq.text}</p>
                                    {renderOptions('rc', sq, isSubmitted)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {!isSubmitted && <button onClick={submitAll} className="w-full bg-green-600 hover:bg-green-700 text-white text-2xl font-black py-5 rounded-2xl shadow-xl transform hover:-translate-y-1 transition truncate min-w-0">NỘP BÀI</button>}
              </div>
            )}
          </div>
        </div>
      );
    });

    const ResultScreen = React.memo(({ ThemeToggleBtn, score, prepareQuiz, navigate, currentUser, endRemark }) => {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 transition-colors">
          <div className="absolute top-4 right-4"><ThemeToggleBtn /></div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 max-w-sm w-full text-center border-t-8 border-green-500 transition-colors min-w-0">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner shrink-0"><Icons.Check /></div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 truncate min-w-0">Xong!</h1>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-4 border border-slate-200 dark:border-slate-700 mt-4 shadow-inner transition-colors min-w-0">
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 truncate min-w-0">ĐIỂM CỦA BẠN</p>
              <div className="text-6xl font-black text-blue-600 dark:text-blue-400 truncate min-w-0">{score.correct} <span className="text-3xl text-slate-300 dark:text-slate-600">/ {score.total}</span></div>
            </div>
            {endRemark && (
               <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800/50 min-w-0">
                  <p className="text-md font-bold text-amber-800 dark:text-amber-400 italic break-words min-w-0">"{endRemark}"</p>
               </div>
            )}
            <div className="space-y-3 min-w-0">
              <button onClick={prepareQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition whitespace-nowrap truncate min-w-0 px-2">Làm lại</button>
              <button onClick={() => navigate(currentUser ? 'Home' : 'Login')} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-xl transition-colors whitespace-nowrap truncate min-w-0 px-2">Thoát</button>
            </div>
          </div>
        </div>
      );
    });

    // ================= MAIN APP CỐT LÕI =================

    function MainApp() {
      const [isGlobalLoading, setIsGlobalLoading] = useState(true);
      const [isFetchingQuiz, setIsFetchingQuiz] = useState(false);

      const [hash, setHash] = useState(() => {
          const initialHash = window.location.hash.replace(/^#\/?/, '');
          if (!initialHash || initialHash.toLowerCase() === 'login') {
              try {
                  if (localStorage.getItem('quiz_current_user')) return 'Home';
              } catch(e) {}
              return 'Login';
          }
          return initialHash;
      });
      
      useEffect(() => {
        const handleHashChange = () => setHash(window.location.hash.replace(/^#\/?/, '') || 'Login');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
      }, []);

      const navigate = useCallback((path) => {
        window.location.hash = `/${path}`;
        setHash(path); // Update state instantly to prevent race conditions!
      }, []);

      const hashParts = hash.split('/');
      const currentRoute = hashParts[0] ? hashParts[0].toLowerCase() : 'login';
      let urlCode = null;
      let urlAction = null;
      
      if (currentRoute === 'overview' && hashParts[1]) {
         urlCode = hashParts[1];
         if (hashParts[2]) urlAction = hashParts[2].toLowerCase();
      }

      let activeScreen = 'login';
      if (currentRoute === 'login' || currentRoute === '') activeScreen = 'login';
      else if (currentRoute === 'home') activeScreen = 'dashboard';
      else if (currentRoute === 'create') activeScreen = 'input';
      else if (currentRoute === 'overview') {
          if (!urlAction) activeScreen = 'overview';
          else if (urlAction === 'test') activeScreen = 'quiz';
          else if (urlAction === 'edittext') activeScreen = 'input';
          else if (urlAction === 'editquestion') activeScreen = 'settings';
          else if (urlAction === 'result') activeScreen = 'result';
      }

      const [fbUser, setFbUser] = useState(null);
      const [currentUser, setCurrentUser] = useState(() => {
          try {
              const saved = localStorage.getItem('quiz_current_user');
              return saved ? JSON.parse(saved) : null;
          } catch(e) { return null; }
      }); 

      useEffect(() => {
          if (currentUser) localStorage.setItem('quiz_current_user', JSON.stringify(currentUser));
          else localStorage.removeItem('quiz_current_user');
      }, [currentUser]);

      useEffect(() => {
          if (currentUser && currentRoute === 'login') {
              navigate('Home');
          }
      }, [currentUser, currentRoute, navigate]);
      
      const [globalMessage, setGlobalMessage] = useState({ text: '', type: 'error' });
      const [theme, setTheme] = useState(localStorage.getItem('quiz_theme') || 'light');
      
      const [myQuizzes, setMyQuizzes] = useState([]);
      const [rawTexts, setRawTexts] = useState({ mc: '', tf: '', sa: '', rc: '', file: '' });

      const [quizTitle, setQuizTitle] = useState(''); 
      const [timeLimit, setTimeLimit] = useState(''); 
      const [isReadOnly, setIsReadOnly] = useState(false);
      const [currentQuizCode, setCurrentQuizCode] = useState(null);
      const [parsedData, setParsedData] = useState({ mc: [], tf: [], sa: [], rc: [] });
      const [editingQ, setEditingQ] = useState(null); 
      
      const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null, confirmText: 'Đồng ý', cancelText: 'Hủy' });

      const [saveCooldown, setSaveCooldown] = useState(0);
      const [isSaving, setIsSaving] = useState(false);

      const [config, setConfig] = useState({ mode: 'single', shuffle: 'none' });
      const [activeQuiz, setActiveQuiz] = useState({ mc: [], tf: [], sa: [], rc: [], flat: [] });
      const [answers, setAnswers] = useState({}); 
      const [currentIndex, setCurrentIndex] = useState(0); 
      const [isSubmitted, setIsSubmitted] = useState(false); 
      const [singleQuestionConfirmed, setSingleQuestionConfirmed] = useState(false); 
      const [score, setScore] = useState({ correct: 0, total: 0 });
      const [endRemark, setEndRemark] = useState('');

      useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('quiz_theme', theme);
      }, [theme]);
      const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

      useEffect(() => {
         if (currentRoute === 'overview' && isReadOnly) {
            if (activeScreen === 'input' || activeScreen === 'settings') {
               navigate(`Overview/${urlCode}`);
            }
         }
      }, [currentRoute, activeScreen, isReadOnly, urlCode, navigate]);

      useEffect(() => {
         if (currentRoute === 'create' || currentRoute === 'overview') {
            localStorage.setItem('quiz_draft_raw', JSON.stringify(rawTexts));
            localStorage.setItem('quiz_draft_parsed', JSON.stringify(parsedData));
            localStorage.setItem('quiz_draft_title', quizTitle);
            localStorage.setItem('quiz_draft_time', timeLimit);
            localStorage.setItem('quiz_draft_code', currentQuizCode || '');
         }
      }, [rawTexts, parsedData, quizTitle, timeLimit, currentQuizCode, currentRoute]);

      useEffect(() => {
         try {
           const savedRaw = localStorage.getItem('quiz_draft_raw');
           if (savedRaw) setRawTexts(JSON.parse(savedRaw));
           const savedParsed = localStorage.getItem('quiz_draft_parsed');
           if (savedParsed) setParsedData(JSON.parse(savedParsed));
           setQuizTitle(localStorage.getItem('quiz_draft_title') || '');
           setTimeLimit(localStorage.getItem('quiz_draft_time') || '');
           setCurrentQuizCode(localStorage.getItem('quiz_draft_code') || null);
         } catch(e) {}
      }, []);

      useEffect(() => {
          if (!fbUser) return;
          if (currentRoute === 'overview' && urlCode && urlCode !== 'draft' && urlCode !== currentQuizCode) {
              if (db) {
                  setIsFetchingQuiz(true);
                  db.doc(`${quizzesPath}/${urlCode}`).get().then(snap => {
                      if (snap.exists) {
                          const data = snap.data();
                          if (data.expiresAt > Date.now()) {
                              setParsedData({ mc: [], tf: [], sa: [], rc: [], ...data.parsedData });
                              if (data.rawTexts) setRawTexts(data.rawTexts);
                              setQuizTitle(data.title || '');
                              setTimeLimit(data.timeLimit || '');
                              setCurrentQuizCode(urlCode);
                              const isOwner = currentUser && currentUser.username.toLowerCase() === data.owner;
                              setIsReadOnly(!isOwner);
                          } else {
                              showMessage("Đề thi đã hết hạn!");
                              navigate('Login');
                          }
                      } else {
                          showMessage("Không tìm thấy mã đề!");
                          navigate('Login');
                      }
                      setIsFetchingQuiz(false);
                  }).catch((err) => {
                      console.error("Lỗi lấy đề thi:", err);
                      setIsFetchingQuiz(false);
                  });
              }
          }
      }, [urlCode, currentRoute, db, currentUser, currentQuizCode, navigate, fbUser]);

      useEffect(() => {
        if (currentRoute === 'create' && !currentQuizCode) {
            setSaveCooldown(5);
            const timerId = setInterval(() => {
                setSaveCooldown((prev) => {
                    if (prev <= 1) { clearInterval(timerId); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerId);
        } else {
            setSaveCooldown(0);
        }
      }, [currentRoute, currentQuizCode]);

      useEffect(() => {
        if (!auth) return;
        const initAuth = async () => { 
            try { 
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await auth.signInWithCustomToken(__initial_auth_token);
                } else {
                    await auth.signInAnonymously(); 
                }
            } catch (error) {
                console.error("Lỗi xác thực:", error);
            } 
        };
        initAuth();
        const unsub = auth.onAuthStateChanged((u) => {
            setFbUser(u);
            setIsGlobalLoading(false);
        });
        return () => unsub();
      }, []);

      useEffect(() => {
        if (!fbUser || !currentUser || !db) return;
        const usernameLower = currentUser.username.toLowerCase();
        const unsub = db.collection(quizzesPath)
          .where("owner", "==", usernameLower)
          .onSnapshot((snap) => {
            const list = [];
            const now = Date.now();
            snap.forEach(docSnap => {
               const data = docSnap.data();
               const currentExpires = data.expiresAt || (data.createdAt + 30 * 24 * 60 * 60 * 1000);
               if (currentExpires > now) {
                   list.push({ id: docSnap.id, ...data, expiresAt: currentExpires });
               } else {
                   db.doc(`${quizzesPath}/${docSnap.id}`).delete().catch(e => {});
               }
            });
            setMyQuizzes(list.sort((a,b) => b.createdAt - a.createdAt));
          }, (error) => {
              console.error("Lỗi snapshot đề thi:", error);
          });
        return () => unsub();
      }, [fbUser, currentUser, db]);

      const showMessage = useCallback((text, type = 'error') => {
        setGlobalMessage({ text, type });
        setTimeout(() => setGlobalMessage({ text: '', type: 'error' }), 3500);
      }, []);

      const copyToClipboard = async (text, codeToShow = '') => {
        const successMsg = codeToShow ? `ĐÃ COPY: ${codeToShow}` : `Đã copy: ${text}`;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showMessage(successMsg, "success"); return;
          }
        } catch (err) {}
        const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); showMessage(successMsg, "success"); } 
        catch (err) { showMessage("Bôi đen để copy nhé.", "error"); }
        document.body.removeChild(ta);
      };

      const handleLogin = async (e) => {
        e.preventDefault();
        const rawUname = e.target.username.value;
        const uname = rawUname.replace(/\s+/g, '');
        const pwd = e.target.password.value;
        if (!uname || !pwd) return showMessage("Vui lòng nhập đủ thông tin.");
        const userRef = db.doc(`${usersPath}/${uname.toLowerCase()}`);
        try {
          const userSnap = await userRef.get();
          if (userSnap.exists) {
            if (userSnap.data().password === pwd) {
              setCurrentUser({ username: userSnap.data().username }); navigate('Home');
            } else showMessage("Sai mật khẩu!");
          } else {
            await userRef.set({ username: uname, password: pwd });
            setCurrentUser({ username: uname }); navigate('Home');
            showMessage("Tạo tài khoản thành công!", "success");
          }
        } catch (error) { showMessage("Lỗi kết nối mạng."); }
      };

      const handleDeleteAccount = () => {
        const target = currentUser.username;
        setCustomAlert({
            isOpen: true, title: "CẢNH BÁO", message: `Bạn chắc chắn muốn xóa tài khoản "${target}" chứ? Toàn bộ đề thi của bạn sẽ mất.`,
            type: 'danger', confirmText: 'Xóa ngay', cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                  const usernameLower = target.toLowerCase();
                  for (const q of myQuizzes) await db.doc(`${quizzesPath}/${q.id}`).delete();
                  await db.doc(`${usersPath}/${usernameLower}`).delete();
                  showMessage("Đã dọn dẹp dữ liệu tài khoản!", "success");
                  setCurrentUser(null); navigate('Login');
                } catch (error) { showMessage("Lỗi khi thực hiện!"); }
            }
        });
      };

      const handleChangePassword = async (e) => {
        e.preventDefault();
        const oldPwd = e.target.oldPassword.value;
        const newPwd = e.target.newPassword.value;
        const userRef = db.doc(`${usersPath}/${currentUser.username.toLowerCase()}`);
        try {
          const snap = await userRef.get();
          if (snap.data().password === oldPwd) {
            await userRef.update({ password: newPwd });
            showMessage("Đổi mật khẩu thành công!", "success");
          } else showMessage("Mật khẩu cũ không đúng!");
        } catch (err) { showMessage("Lỗi đổi mật khẩu!"); }
      };

      const handleCodeInputChange = (e) => {
          let val = e.target.value;
          const urlMatch = val.match(/([a-zA-Z0-9]{6})\/?$/);
          if (val.includes('http') && urlMatch) {
              e.target.value = urlMatch[1].toUpperCase();
          } else {
              e.target.value = val.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
          }
      };

      const handleGuestJoin = async (e) => {
        e.preventDefault();
        const code = e.target.shareCode.value.toUpperCase();
        if (code.length !== 6) return showMessage("Mã đề phải gồm 6 ký tự (ví dụ: ABCDEF).");
        if (!db) return showMessage("Đang tải CSDL, vui lòng thử lại!");

        try {
            const qDoc = await db.doc(`${quizzesPath}/${code}`).get();
            if (qDoc.exists) {
                const data = qDoc.data();
                if (data.expiresAt > Date.now()) {
                    const safeParsed = { mc: [], tf: [], sa: [], rc: [], ...data.parsedData };
                    setParsedData(safeParsed); setIsReadOnly(true); setCurrentQuizCode(code); navigate(`Overview/${code}`);
                } else {
                    showMessage("Đề thi đã hết hạn!");
                }
            } else {
                showMessage("Mã không đúng hoặc đề không tồn tại!");
            }
        } catch (error) {
            showMessage("Lỗi kết nối máy chủ!");
        }
      };

      const cloneQuizAdmin = async (customParsed, customTitle, customRaw) => {
          if (!db || !currentUser) return;
          const newCode = generateShareCode();
          const usernameLower = currentUser.username.toLowerCase();
          const clonedTitle = `${customTitle || quizTitle || 'Đề thi'} (Copy)`;
          const dataToClone = customParsed || parsedData;
          const rawToClone = customRaw || rawTexts;
          try {
              await db.doc(`${quizzesPath}/${newCode}`).set({
                  code: newCode, owner: usernameLower, title: clonedTitle, parsedData: dataToClone, rawTexts: rawToClone,
                  createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, timeLimit: timeLimit
              });
              showMessage("Nhân bản thành công!", "success");
              if (!customParsed) {
                  setCurrentQuizCode(newCode); setIsReadOnly(false); setQuizTitle(clonedTitle);
                  navigate(`Overview/${newCode}`);
              }
          } catch(e) { showMessage("Lỗi nhân bản!"); }
      };

      const parseTextEngine = (text, forcedType) => {
        let result = []; let currentQ = null, currentSubQ = null; let currentSectionType = forcedType; 
        const lines = (text || '').split('\n');
        for (let rawLine of lines) {
          let line = rawLine.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
          if (!line) continue;
          if (forcedType === 'mixed') {
              const secMatch = line.match(/^[Pp]hần\s+([IVX]+|[1-4])/i);
              if (secMatch) {
                  const secNum = secMatch[1].toUpperCase();
                  if (secNum === 'I' || secNum === '1') currentSectionType = 'mc';
                  else if (secNum === 'II' || secNum === '2') currentSectionType = 'tf';
                  else if (secNum === 'III' || secNum === '3') currentSectionType = 'sa';
                  else if (secNum === 'IV' || secNum === '4') currentSectionType = 'rc';
                  continue; 
              }
          }
          const activeType = currentSectionType === 'mixed' ? 'mc' : currentSectionType;
          const qMatch = line.match(/^[Cc][âa]u\s*\d+[\.\:\)]\s*(.*)/);
          if (qMatch) {
            if (currentQ) result.push(currentQ);
            currentQ = { id: generateId(), text: qMatch[1] || "", type: activeType, options: [], subQuestions: [], image: null };
            currentSubQ = null; continue;
          }
          const subQMatch = line.match(/^#\d+[\.\:\)]\s*(.*)/);
          if (subQMatch && currentQ) {
            currentQ.type = 'rc'; currentSubQ = { id: generateId(), text: subQMatch[1] || "", options: [] };
            currentQ.subQuestions.push(currentSubQ); continue;
          }
          const optMatch = line.match(/^(\*?)\s*([A-Za-zĐđ])[\.\)]\s*(.*)/);
          if (optMatch) {
            const optObj = { id: generateId(), text: optMatch[3], isCorrect: optMatch[1] === '*' };
            if (currentSubQ) currentSubQ.options.push(optObj);
            else if (currentQ) { currentQ.options.push(optObj); if (!currentQ.type) currentQ.type = 'mc'; }
            continue;
          }
          const saMatch = line.match(/^\*\s*(.+?)\s*\*$/);
          if (saMatch && currentQ && !currentSubQ && currentQ.options.length === 0) {
            currentQ.type = 'sa'; currentQ.options.push({ id: generateId(), text: saMatch[1], isCorrect: true }); continue;
          }
          if (currentSubQ) {
            if (currentSubQ.options.length === 0) currentSubQ.text += '\n' + line;
            else currentSubQ.options[currentSubQ.options.length - 1].text += '\n' + line;
          } else if (currentQ) {
            if (currentQ.options.length === 0) currentQ.text += '\n' + line;
            else currentQ.options[currentQ.options.length - 1].text += '\n' + line;
          }
        }
        if (currentQ) result.push(currentQ);
        result.forEach(q => {
            q.text = q.text.trim(); q.options.forEach(o => o.text = o.text.trim());
            if (q.subQuestions) q.subQuestions.forEach(sq => { sq.text = sq.text.trim(); sq.options.forEach(o => o.text = o.text.trim()); });
        });
        return result;
      };

      const processAndSaveQuizzes = async () => {
        if(saveCooldown > 0 || isSaving) return; 
        setIsSaving(true); 
        let allMC = [], allTF = [], allSA = [], allRC = [];
        if (rawTexts.file) { 
            const mixedItems = parseTextEngine(rawTexts.file, 'mixed');
            mixedItems.forEach(item => {
              if (item.type === 'mc') allMC.push(item); else if (item.type === 'tf') allTF.push(item);
              else if (item.type === 'sa') allSA.push(item); else if (item.type === 'rc') allRC.push(item);
            });
        } else {
            allMC.push(...parseTextEngine(rawTexts.mc, 'mc')); allTF.push(...parseTextEngine(rawTexts.tf, 'tf'));
            allSA.push(...parseTextEngine(rawTexts.sa, 'sa')); allRC.push(...parseTextEngine(rawTexts.rc, 'rc'));
        }
        const newParsedData = { mc: allMC, tf: allTF, sa: allSA, rc: allRC };
        setParsedData(newParsedData);
        let finalCode = currentQuizCode;
        let isSavedToCloud = false;

        if (currentUser && db && !isReadOnly) {
            const usernameLower = currentUser.username.toLowerCase();
            const isAdmin = usernameLower === ADMIN_USERNAME;
            if (!isAdmin && !currentQuizCode) {
              const userQuizzesCount = myQuizzes.length; 
              if (userQuizzesCount >= MAX_QUIZZES_PER_USER) {
                showMessage(`Đạt giới hạn ${MAX_QUIZZES_PER_USER} đề. Đề này chỉ được lưu tạm trên máy.`, "error");
                setIsSaving(false); navigate(`Overview/${currentQuizCode || 'draft'}`); return;
              }
            }
            finalCode = currentQuizCode || generateShareCode();
            let finalTitle = quizTitle.trim();
            if (!finalTitle) {
                const targetText = rawTexts.file ? rawTexts.file : (rawTexts.mc || rawTexts.tf || rawTexts.sa || rawTexts.rc);
                const firstLine = (targetText || "").split('\n').find(l => l.trim().length > 0);
                if(firstLine) finalTitle = firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine;
                else finalTitle = "Đề thi không tên";
                setQuizTitle(finalTitle);
            }
            
            const parsedTimeLimit = parseInt(timeLimit) || 0;

            try {
              const savePromise = db.doc(`${quizzesPath}/${finalCode}`).set({ 
                  code: finalCode, owner: usernameLower, title: finalTitle, parsedData: newParsedData, rawTexts, 
                  createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
                  timeLimit: parsedTimeLimit
              }, {merge: true});

              const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error("TIMEOUT_ERROR")), 150000);
              });

              // CHỜ LƯU LÊN CLOUD THÀNH CÔNG HOẶC HẾT 150 GIÂY
              await Promise.race([savePromise, timeoutPromise]);

              isSavedToCloud = true;
              showMessage("Đã lưu vào Kho đám mây!", "success");
              
              // KHẮC PHỤC TẬN GỐC LỖI TẠO MÃ RỒI BỊ XÓA MẤT:
              // Gọi đồng thời Navigate và SetCurrentQuizCode để React gộp chung (batch update)
              // TUYỆT ĐỐI KHÔNG dùng setTimeout ở đây, nếu không useEffect dọn dẹp nháp sẽ kích hoạt sai!
              setCurrentQuizCode(finalCode);
              setIsSaving(false); 
              navigate(`Overview/${finalCode}`);
              return; 
            } catch (e) {
                if (e.message === "TIMEOUT_ERROR") {
                    showMessage("Kiểm tra đường truyền kết nối của bạn", "error");
                } else {
                    console.error("Lỗi khi lưu lên Firestore:", e);
                    showMessage("Lỗi: Không thể kết nối với kho dữ liệu!", "error");
                }
                setIsSaving(false);
                return;
            }
        }
        
        if (!isSavedToCloud) {
            showMessage("Đã lưu nháp thành công!", "success");
        }

        setIsSaving(false); 
        navigate(`Overview/${finalCode || 'draft'}`); 
      };

      const handleParseAndSave = () => {
        if (saveCooldown > 0 || isSaving) return;
        if (currentRoute === 'overview' && urlAction === 'edittext') {
           setCustomAlert({
               isOpen: true, title: "Bạn có muốn lưu text này không?", message: "Tất cả những gì bạn đã làm trong phần \"Sửa câu hỏi\" sẽ mất",
               type: 'warning', confirmText: 'Vẫn Lưu', cancelText: 'Hủy bỏ', onConfirm: processAndSaveQuizzes
           });
        } else {
           processAndSaveQuizzes();
        }
      };

      const handleImageUpload = async (qId, sectionId, file) => {
        if (!file) return;
        if (!currentQuizCode) {
            showMessage("Vui lòng Bấm Lưu đề thi 1 lần trước khi thêm ảnh!", "error");
            return;
        }
        if (file.size > 32 * 1024 * 1024) {
            showMessage("Ảnh quá lớn! Vui lòng chọn ảnh < 32MB.", "error");
            return;
        }

        if (IMGBB_API_KEY === "THAY_MA_API_IMGBB_CUA_BAN_VAO_DAY") {
            showMessage("Bạn chưa cấu hình API Key của ImgBB trong mã nguồn!", "error");
            return;
        }
        
        showMessage("Đang tải ảnh lên máy chủ...", "success");

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                const imageUrl = data.data.url;
                const newData = { ...parsedData };
                const q = newData[sectionId].find(x => x.id === qId);
                if (q) {
                    q.image = imageUrl;
                    setParsedData(newData);
                    if (currentUser && db) {
                        try {
                            await db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: newData });
                            showMessage("Tải ảnh và lưu thành công!", "success");
                        } catch (err) {
                            showMessage("Lỗi lưu ảnh vào dữ liệu.", "error");
                        }
                    }
                }
            } else {
                showMessage("Lỗi upload từ ImgBB: " + (data.error?.message || "Không xác định"), "error");
            }
        } catch (error) {
            console.error("Lỗi upload ảnh:", error);
            showMessage("Không thể kết nối máy chủ ảnh!", "error");
        }
      };

      const changeQuestionType = (newType) => {
          const currentType = editingQ.data.type;
          if (currentType === newType) return;
          let newData = { ...editingQ.data, type: newType };
          if (newType === 'rc' && currentType !== 'rc') {
              newData.subQuestions = [{ id: generateId(), text: '#1. Câu hỏi phụ', options: newData.options || [] }];
              newData.options = [];
          } else if (currentType === 'rc' && newType !== 'rc') {
              newData.options = newData.subQuestions[0]?.options || [];
              newData.subQuestions = [];
          }
          if (newType === 'sa' && newData.options.length === 0) newData.options = [{id: generateId(), text: '', isCorrect: true}];
          setEditingQ({ ...editingQ, data: newData, oldSectionId: editingQ.oldSectionId || editingQ.sectionId, sectionId: newType });
      };

      const saveInlineEdit = async () => {
         const newData = {...parsedData};
         const targetSection = editingQ.data.type;
         const originalSection = editingQ.oldSectionId || editingQ.sectionId;
         if (editingQ.isNew) newData[targetSection].push(editingQ.data);
         else {
             if (originalSection !== targetSection) {
                 newData[originalSection] = newData[originalSection].filter(q => q.id !== editingQ.data.id);
                 newData[targetSection].push(editingQ.data);
             } else {
                 const index = newData[targetSection].findIndex(q => q.id === editingQ.data.id);
                 if (index !== -1) newData[targetSection][index] = editingQ.data;
             }
         }
         setParsedData(newData); setEditingQ(null);
         if (currentUser && currentQuizCode && db) {
            try { await db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: newData }); showMessage("Đã lưu thành công!", "success"); } catch(e) {}
         }
      };

      const removeInlineQuestion = () => {
         setCustomAlert({
             isOpen: true, title: "Xóa câu hỏi", message: "Xác nhận XÓA HOÀN TOÀN câu hỏi này?", type: 'danger', confirmText: 'Xóa ngay', cancelText: 'Hủy',
             onConfirm: async () => {
                 const newData = {...parsedData};
                 newData[editingQ.sectionId] = newData[editingQ.sectionId].filter(q => q.id !== editingQ.data.id);
                 setParsedData(newData); setEditingQ(null);
                 if (currentUser && currentQuizCode && db) {
                    try { await db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: newData }); showMessage("Đã xóa!", "success"); } catch(e) {}
                 }
             }
         });
      };

      const handleAddNewQuestion = (sectionId) => {
          const newQ = { id: generateId(), text: "Câu hỏi mới...", type: sectionId, options: sectionId === 'rc' ? [] : [{id: generateId(), text: 'Đáp án 1', isCorrect: true}, {id: generateId(), text: 'Đáp án 2', isCorrect: false}], subQuestions: sectionId === 'rc' ? [{id: generateId(), text: '#1. Câu hỏi phụ mới', options: [{id: generateId(), text: 'Đáp án 1', isCorrect: true}]}] : [], image: null };
          setEditingQ({ sectionId: sectionId, data: newQ, isNew: true });
      };

      const prepareQuiz = () => {
        let finalMc = [...parsedData.mc], finalTf = [...parsedData.tf], finalSa = [...parsedData.sa], finalRc = [...(parsedData.rc || [])];
        const shuffleOpts = config.shuffle === 'options' || config.shuffle === 'both';
        const shuffleQ = config.shuffle === 'questions' || config.shuffle === 'both';
        if (shuffleQ) { finalMc = shuffleArray(finalMc); finalTf = shuffleArray(finalTf); finalSa = shuffleArray(finalSa); finalRc = shuffleArray(finalRc); }
        if (shuffleOpts) {
          finalMc.forEach(q => { q.options = shuffleArray(q.options); }); finalTf.forEach(q => { q.options = shuffleArray(q.options); });
          finalRc.forEach(q => { q.subQuestions.forEach(sq => { sq.options = shuffleArray(sq.options); }) });
        }
        setActiveQuiz({ mc: finalMc, tf: finalTf, sa: finalSa, rc: finalRc, flat: [...finalMc, ...finalTf, ...finalSa, ...finalRc] });
        setAnswers({}); setCurrentIndex(0); setIsSubmitted(false); setSingleQuestionConfirmed(false); setEndRemark(''); 
        let rcQCount = finalRc.reduce((acc, q) => acc + q.subQuestions.length, 0);
        setScore({ correct: 0, total: finalMc.length + finalTf.length + finalSa.length + rcQCount });
        navigate(`Overview/${currentQuizCode || 'draft'}/Test`);
      };

      const checkQuestionCorrect = useCallback((type, qObj, userAns) => {
        if (type === 'mc' || type === 'rc') {
          const correctIds = qObj.options.filter(o => o.isCorrect).map(o => o.id);
          return Array.isArray(userAns) && userAns.length > 0 && correctIds.includes(userAns[0]);
        } else if (type === 'tf') {
          const correctIds = qObj.options.filter(o => o.isCorrect).map(o => o.id);
          return Array.isArray(userAns) && userAns.length === correctIds.length && userAns.every(id => correctIds.includes(id));
        } else if (type === 'sa') {
          if (typeof userAns !== 'string' || !userAns.trim()) return false;
          if (!qObj.options || qObj.options.length === 0) return false; 
          const cleanUser = userAns.trim().replace(',', '.'); const cleanCorrect = qObj.options[0].text.trim().replace(',', '.');
          if (!isNaN(parseFloat(cleanUser)) && !isNaN(parseFloat(cleanCorrect))) return parseFloat(cleanUser) === parseFloat(cleanCorrect);
          return cleanUser.toLowerCase() === cleanCorrect.toLowerCase();
        }
        return false;
      }, []);

      const generateRandomRemark = useCallback((correct, total) => {
          if (total === 0) return '';
          const percent = (correct / total) * 100;
          let category = 'bad'; if (percent >= 85) category = 'good'; else if (percent >= 50) category = 'average';
          const array = RESULT_REMARKS[category]; return array[Math.floor(Math.random() * array.length)];
      }, []);

      const Notification = () => (
        globalMessage.text && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-bold text-white text-center animate-fade-in ${globalMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'} whitespace-nowrap`}>
            {globalMessage.text}
          </div>
        )
      );

      const CustomConfirmModal = () => {
        if (!customAlert.isOpen) return null;
        return (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-bounce-in border border-slate-200 dark:border-slate-700">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0 ${customAlert.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500' : 'bg-red-100 dark:bg-red-900/40 text-red-500'}`}>
                   <Icons.Alert />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{customAlert.title}</h3>
                <p className={`mb-8 font-medium break-words ${customAlert.type === 'warning' ? 'text-amber-600 dark:text-amber-500 text-sm' : 'text-slate-600 dark:text-slate-400'}`}>{customAlert.message}</p>
                <div className="flex gap-3">
                   <button onClick={() => { customAlert.onConfirm(); setCustomAlert({isOpen: false}); }} className={`flex-1 text-white font-bold py-3 rounded-xl shadow-md transition whitespace-nowrap ${customAlert.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}>{customAlert.confirmText}</button>
                   <button onClick={() => setCustomAlert({isOpen: false})} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 rounded-xl transition whitespace-nowrap">{customAlert.cancelText}</button>
                </div>
             </div>
          </div>
        );
      };

      const ThemeToggleBtn = () => (
        <button onClick={toggleTheme} className="p-2 sm:p-2.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center justify-center shrink-0" title="Đổi giao diện">
          {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
        </button>
      );

      const resetQuiz = useCallback(() => {
          setRawTexts({ mc:'', tf:'', sa:'', rc:'', file:'' }); 
          setParsedData({mc:[], tf:[], sa:[], rc:[]});
          setQuizTitle('');
          setTimeLimit('');
          setCurrentQuizCode(null);
          setIsReadOnly(false);
          navigate('Create');
      }, [navigate]);

      // --- RENDER ĐANG TẢI ---
      if (isSetupNeeded) return <SetupScreen />;
      if (isGlobalLoading || isFetchingQuiz) return <LoadingScreen />;

      // --- ĐIỀU HƯỚNG BẰNG CÁC COMPONENT ĐỘC LẬP ---
      if (activeScreen === 'login') return <LoginScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} handleGuestJoin={handleGuestJoin} handleCodeInputChange={handleCodeInputChange} handleLogin={handleLogin} />;
      
      if (activeScreen === 'dashboard') return <DashboardScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} currentUser={currentUser} setCurrentUser={setCurrentUser} navigate={navigate} resetQuiz={resetQuiz} myQuizzes={myQuizzes} db={db} quizzesPath={quizzesPath} handleGuestJoin={handleGuestJoin} handleCodeInputChange={handleCodeInputChange} handleDeleteAccount={handleDeleteAccount} handleChangePassword={handleChangePassword} copyToClipboard={copyToClipboard} setCustomAlert={setCustomAlert} />;
      
      if (activeScreen === 'input') return <InputScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} navigate={navigate} quizTitle={quizTitle} setQuizTitle={setQuizTitle} currentQuizCode={currentQuizCode} rawTexts={rawTexts} setRawTexts={setRawTexts} handleParseAndSave={handleParseAndSave} saveCooldown={saveCooldown} isSaving={isSaving} />;
      
      if (activeScreen === 'overview') return <OverviewScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} quizTitle={quizTitle} timeLimit={timeLimit} setTimeLimit={setTimeLimit} currentQuizCode={currentQuizCode} copyToClipboard={copyToClipboard} config={config} setConfig={setConfig} prepareQuiz={prepareQuiz} isReadOnly={isReadOnly} navigate={navigate} cloneQuizAdmin={cloneQuizAdmin} currentUser={currentUser} />;
      
      if (activeScreen === 'settings') return <SettingsScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} parsedData={parsedData} setParsedData={setParsedData} editingQ={editingQ} setEditingQ={setEditingQ} navigate={navigate} currentQuizCode={currentQuizCode} isReadOnly={isReadOnly} currentUser={currentUser} db={db} handleImageUpload={handleImageUpload} changeQuestionType={changeQuestionType} saveInlineEdit={saveInlineEdit} removeInlineQuestion={removeInlineQuestion} handleAddNewQuestion={handleAddNewQuestion} showMessage={showMessage} quizzesPath={quizzesPath} />;
      
      if (activeScreen === 'quiz') return <QuizScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} activeQuiz={activeQuiz} answers={answers} setAnswers={setAnswers} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} isSubmitted={isSubmitted} setIsSubmitted={setIsSubmitted} singleQuestionConfirmed={singleQuestionConfirmed} setSingleQuestionConfirmed={setSingleQuestionConfirmed} score={score} setScore={setScore} endRemark={endRemark} setEndRemark={setEndRemark} navigate={navigate} currentQuizCode={currentQuizCode} currentUser={currentUser} config={config} checkQuestionCorrect={checkQuestionCorrect} generateRandomRemark={generateRandomRemark} showMessage={showMessage} timeLimit={timeLimit} setCustomAlert={setCustomAlert} />;
      
      if (activeScreen === 'result') return <ResultScreen ThemeToggleBtn={ThemeToggleBtn} score={score} endRemark={endRemark} prepareQuiz={prepareQuiz} navigate={navigate} currentUser={currentUser} />;
      
      return null;
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<MainApp />);
