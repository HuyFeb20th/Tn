const { useState, useEffect, useMemo, useCallback } = React;

var LoginScreen = React.memo(({ ThemeToggleBtn, Notification, handleGuestJoin, handleCodeInputChange, handleLogin, handleGuestLogin }) => {
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
                    <input type="text" name="username" placeholder="Tên đăng nhập" maxLength={15} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
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
                <button type="button" onClick={handleGuestLogin} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-3.5 rounded-xl transition shadow mt-3 flex items-center justify-center gap-2 whitespace-nowrap">
                    <Icons.User /> Đăng nhập Khách
                </button>
                </form>
            </div>
            </div>
        </div>
    );
});

var DashboardScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, currentUser, setCurrentUser, navigate, resetQuiz, myQuizzes, recentQuizzes, setRecentQuizzes, db, quizzesPath, handleGuestJoin, handleCodeInputChange, handleDeleteAccount, handleChangePassword, copyToClipboard, setCustomAlert, handleDeleteQuiz, handleExtendQuiz }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showChangePwd, setShowChangePwd] = useState(false);
    const now = Date.now();
    const usernameLower = currentUser?.username.toLowerCase();
    const isAdmin = usernameLower === ADMIN_USERNAME;
    const isVip = currentUser?.isVip || false;
    const isGuest = currentUser?.isGuest || false;
    
    const dbQuizzesCount = myQuizzes.filter(q => !q.isLocal).length;
    const limitText = isAdmin ? "Admin Không giới hạn" : (isVip ? `${dbQuizzesCount}/${MAX_QUIZZES_PER_VIP} đề` : `${dbQuizzesCount}/${MAX_QUIZZES_PER_USER} đề`);

    const handleDeleteRecent = (code) => {
        const newRecents = recentQuizzes.filter(r => r.code !== code);
        setRecentQuizzes(newRecents);
        localStorage.setItem('quiz_recent_history', JSON.stringify(newRecents));
    };

    return (
        <div className="min-h-screen p-4 md:p-8 animate-fade-in bg-slate-50 dark:bg-slate-900 transition-colors">
        <Notification />
        <CustomConfirmModal />
        {showChangePwd && !isGuest && (
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
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition w-full text-left">
                    <Icons.User /> 
                    <span className="text-blue-600 dark:text-blue-400 truncate min-w-0">{currentUser?.username}</span> 
                    {!isGuest && isAdmin && <span className="text-[9px] sm:text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 shadow-sm -mt-0.5">ADMIN</span>}
                    {!isGuest && !isAdmin && isVip && <span className="text-[9px] sm:text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 shadow-sm -mt-0.5">VIP</span>}
                    <span className="shrink-0 text-sm ml-0.5">▾</span>
                </button>
                {showUserMenu && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 py-2">
                        {!isGuest && <button onClick={() => {setShowChangePwd(true); setShowUserMenu(false);}} className="w-full text-left px-4 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition whitespace-nowrap"><Icons.Key /> Đổi mật khẩu</button>}
                        {isAdmin && (
                        <button onClick={() => window.location.href = 'admin.html'} className="w-full text-left px-4 py-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold transition whitespace-nowrap"><Icons.Shield /> Quản trị Admin</button>
                        )}
                        {!isGuest && <button onClick={() => {handleDeleteAccount(); setShowUserMenu(false);}} className="w-full text-left px-4 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium transition whitespace-nowrap"><Icons.UserX /> Xóa tài khoản</button>}
                    </div>
                    </>
                )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                <ThemeToggleBtn />
                <button onClick={() => { setCurrentUser(null); navigate('Login'); }} title="Đăng xuất" className="p-2 sm:p-2.5 rounded-full text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition flex items-center justify-center shrink-0"><Icons.Logout /></button>
                </div>
            </div>
            <form onSubmit={handleGuestJoin} className="flex-1 flex gap-2 w-full mt-2 sm:mt-0 min-w-0">
                <input type="text" name="shareCode" onChange={handleCodeInputChange} placeholder="Nhập mã hoặc dán link đề..." className="w-full min-w-0 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl text-slate-800 dark:text-white font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow font-bold shrink-0 whitespace-nowrap transition">VÀO THI</button>
            </form>
            </div>

            {/* MỤC ĐỀ LÀM GẦN ĐÂY */}
            {recentQuizzes.length > 0 && (
                <div className="mb-10 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
                    <div className="min-w-0">
                        <h2 className="text-2xl font-black text-amber-600 dark:text-amber-500 truncate">Làm gần đây</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Tối đa 5 đề (tồn tại trong 24h)</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentQuizzes.map(q => {
                        const timeLeftMs = 86400000 - (now - q.savedAt);
                        const hoursLeft = Math.floor(timeLeftMs / 3600000);
                        return (
                            <div key={q.code} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 shadow-sm border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 transition-colors flex flex-col justify-between min-w-0 relative group">
                                <button onClick={() => handleDeleteRecent(q.code)} className="absolute top-2 right-2 p-1.5 text-red-500 bg-white dark:bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100 dark:border-slate-700 hover:bg-red-500 hover:text-white" title="Xóa đề này khỏi lịch sử">
                                    <Icons.Trash />
                                </button>
                                <div className="min-w-0 mb-3 pr-8">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate" title={q.title}>{q.title}</h3>
                                    <div className="text-xs text-amber-600 dark:text-amber-500 font-bold mt-1">Còn {hoursLeft} giờ</div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-amber-800 dark:text-amber-300 font-mono font-black text-base truncate tracking-widest">{q.code}</span>
                                    <button onClick={() => navigate(`Overview/${q.code}`)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg font-bold transition text-sm shrink-0 whitespace-nowrap shadow-sm">Làm lại</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
            <div className="min-w-0">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white truncate">Kho đề thi của bạn</h2>
                {!isGuest && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Đã lưu lên Cloud: {limitText}</p>}
                {isGuest && <p className="text-sm text-amber-500 font-medium whitespace-nowrap">Đề đang lưu cục bộ, hãy Lưu vào TK để tránh mất dữ liệu</p>}
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
                    <div key={q.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${q.isLocal ? 'border-amber-300 dark:border-amber-600/50' : 'border-slate-200 dark:border-slate-700'} hover:border-blue-300 dark:hover:border-blue-500 transition-colors flex flex-col justify-between min-w-0 relative`}>
                    {q.isLocal && <span className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase">Chưa lưu Cloud</span>}
                    <div className="min-w-0 mt-1">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2 truncate">{q.title}</h3>
                        <div className="flex justify-between text-xs mb-4">
                        <span className="text-slate-500 dark:text-slate-400">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className={`${daysLeft <= 5 ? "text-red-500" : "text-amber-500"} font-bold`}>Hết hạn sau {daysLeft} ngày</span>
                        </div>
                        
                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/50 min-w-0 mb-4">
                            <span className="text-blue-800 dark:text-blue-300 font-mono font-black text-lg truncate min-w-0 pl-2 tracking-widest">{q.code}</span>
                            {!q.isLocal ? (
                                <button onClick={() => copyToClipboard(fullLink, q.code)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold transition text-sm shrink-0 whitespace-nowrap shadow-sm">Copy Link</button>
                            ) : (
                                <span className="text-amber-600 font-bold text-xs pr-2">Link tạm</span>
                            )}
                        </div>

                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 relative">
                        <button onClick={() => navigate(`Overview/${q.code}`)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base min-w-0 truncate">Xem / Sửa</button>
                        <button onClick={() => handleExtendQuiz(q)} className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 transition text-sm shrink-0 whitespace-nowrap">+7 Ngày</button>
                        <button onClick={() => {
                            setCustomAlert({
                                isOpen: true, title: "Xóa đề thi", message: "Bạn có chắc chắn muốn xóa đề thi này không?",
                                type: 'danger', confirmText: 'Xóa ngay', cancelText: 'Hủy', onConfirm: () => handleDeleteQuiz(q)
                            });
                        }} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-500 hover:text-white transition shrink-0"><Icons.Trash /></button>
                    </div>
                    </div>
                );
                })}
            </div>
            )}

            {isGuest && myQuizzes.length > 0 && (
                <div className="mt-8 text-center">
                    <button onClick={resetQuiz} className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition shadow-md w-full sm:w-auto shrink-0 whitespace-nowrap">+ TẠO ĐỀ MỚI NGAY</button>
                </div>
            )}
        </div>
        </div>
    );
});

var InputScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, navigate, quizTitle, setQuizTitle, currentQuizCode, rawTexts, setRawTexts, handleParseAndSave, saveCooldown, isSaving, setShowGuestSaveModal, currentUser }) => {
    const [inputTab, setInputTab] = useState('mc');
    const tabs = [{ id: 'mc', label: 'I. Trắc nghiệm' }, { id: 'tf', label: 'II. Đúng sai' }, { id: 'sa', label: 'III. Trả lời ngắn' }, { id: 'rc', label: 'IV. Đọc hiểu' }, { id: 'file', label: 'Tải File / Hỗn hợp' }];
    const placeholders = { 
        mc: "Câu 1. Nội dung...\nA. Lựa chọn 1\n*B. Lựa chọn 2(đúng)",
        tf: "Câu 2: Nội dung...\na) Mệnh đề 1\n*b) Mệnh đề 2(đúng)",
        sa: "Câu 3. Trả lời ngắn\n*4.5*",
        rc: "Câu 4. Đoạn văn...\n#1. Nội dung...\nA. Lựa chọn 1\n*B. Lựa chọn 2(đúng)\n#2. Nội dung...\n*A. Lựa chọn 1(đúng)\nB. Lựa chọn 2",
        file: "Dán hỗn hợp có cấu trúc như các phần trước hoặc file .txt. Có Phần I, Phần II..." 
    };
    const tips = { 
        mc: 'Dùng từ \"Câu\" để xác định câu hỏi. Đáp án \"A.\", \"B.\". Mỗi câu và mỗi đáp án để theo dòng * trước câu đúng.', 
        tf: 'Cấu trúc tương tự trắc nghiệm. Thường dùng \"a)\", \"b)\".',
        sa: 'Bọc đáp án giữa 2 dấu sao *đáp án*.',
        rc: 'Cấu trúc tương tự các phần trên nhưng câu hỏi phụ dùng #1., #2.',
        file: 'Bắt buộc phải có các Phần I, II, III, IV để hệ thống tự nhận diện được.' 
    };

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
                <input type="text" placeholder="Tên Đề Thi..." value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} maxLength={15}
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
            <div className="flex flex-col sm:flex-row gap-4">
            {currentUser?.isGuest && (
                <button onClick={() => setShowGuestSaveModal(true)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg py-4 rounded-2xl shadow-lg transition flex justify-center items-center gap-2 transform hover:-translate-y-1">
                    <Icons.User /> LƯU VÀO TK
                </button>
            )}
            <button onClick={saveCooldown > 0 || isSaving ? null : handleParseAndSave} disabled={saveCooldown > 0 || isSaving}
                className={`flex-1 ${saveCooldown > 0 || isSaving ? 'bg-slate-400 dark:bg-slate-600' : 'bg-green-600 hover:bg-green-700'} text-white font-black text-lg py-4 rounded-2xl shadow-lg transition flex justify-center items-center gap-2 transform ${saveCooldown > 0 || isSaving ? '' : 'hover:-translate-y-1'}`}
            >
                {isSaving ? "ĐANG LƯU..." : saveCooldown > 0 ? `ĐỢI (${saveCooldown}s)` : <><Icons.Check /> LƯU TRÊN MÁY</>}
            </button>
            </div>
        </div>
        </div>
    );
});

var SectionOrderModal = React.memo(({ availableParts, initialSelected, onClose, onSave, ThemeToggleBtn, quizTitle, quizCode }) => {
    const [orderedParts, setOrderedParts] = useState(() => {
        const selected = initialSelected || [];
        const unselected = availableParts.filter(p => !selected.includes(p.id)).map(p => p.id);
        return [...selected, ...unselected];
    });

    const [localSelected, setLocalSelected] = useState(initialSelected || []);

    const toggleLocalSelect = (id) => {
        setLocalSelected(prev => {
            let newSelected = [...prev];
            if (prev.includes(id)) {
                if (prev.length === 1) return prev; 
                newSelected = prev.filter(x => x !== id);
            } else {
                newSelected = [...prev, id];
            }
            
            setOrderedParts(currentOrder => {
                const newOrder = currentOrder.filter(x => x !== id);
                if (newSelected.includes(id)) {
                    const lastSelectedIndex = newOrder.findIndex(item => !newSelected.includes(item));
                    if (lastSelectedIndex === -1) newOrder.push(id);
                    else newOrder.splice(lastSelectedIndex, 0, id);
                } else {
                    newOrder.push(id);
                }
                return newOrder;
            });
            return newSelected;
        });
    };

    const moveItem = (index, direction) => {
        if (direction === 'up' && index > 0) {
            setOrderedParts(prev => {
                const newArr = [...prev];
                [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
                return newArr;
            });
        } else if (direction === 'down' && index < orderedParts.length - 1) {
            setOrderedParts(prev => {
                const newArr = [...prev];
                [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
                return newArr;
            });
        }
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (dragIndex === dropIndex) return;

        setOrderedParts(prev => {
            const newArr = [...prev];
            const [draggedItem] = newArr.splice(dragIndex, 1);
            newArr.splice(dropIndex, 0, draggedItem);
            return newArr;
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-[100] flex flex-col animate-fade-in overflow-hidden transition-colors">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 shrink-0 flex items-center gap-3">
                <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition shrink-0"><Icons.ArrowLeft /></button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white truncate" title={quizTitle}>{quizTitle || "Đề thi"}</h2>
                    {quizCode && <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase inline-block mt-0.5 tracking-wider truncate max-w-full">Mã: {quizCode}</span>}
                </div>
                <ThemeToggleBtn />
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto w-full">
                    <div className="mb-6 text-center">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Chọn và sắp xếp phần thi</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Đánh dấu để chọn. Bấm mũi tên hoặc kéo thả để đổi thứ tự.</p>
                    </div>
                    
                    <div className="space-y-3">
                        {orderedParts.map((partId, index) => {
                            const partInfo = availableParts.find(p => p.id === partId);
                            if (!partInfo) return null;
                            const isSelected = localSelected.includes(partId);

                            return (
                                <div 
                                    key={partId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-move bg-white dark:bg-slate-800 ${isSelected ? 'border-indigo-500 shadow-md' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}
                                >
                                    <div className="shrink-0 text-slate-400 hidden sm:block"><Icons.DragHandle /></div>
                                    <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => toggleLocalSelect(partId)}
                                            className="w-6 h-6 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer" 
                                        />
                                        <span className={`font-bold text-base sm:text-lg truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 line-through'}`}>{partInfo.label}</span>
                                    </label>

                                    {isSelected && (
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button 
                                                onClick={() => moveItem(index, 'up')} 
                                                disabled={index === 0}
                                                className={`p-1.5 rounded-lg transition-colors ${index === 0 ? 'opacity-0 cursor-default' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                            >
                                                <Icons.ArrowUp />
                                            </button>
                                            <button 
                                                onClick={() => moveItem(index, 'down')} 
                                                disabled={index === orderedParts.length - 1}
                                                className={`p-1.5 rounded-lg transition-colors ${index === orderedParts.length - 1 ? 'opacity-0 cursor-default' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                            >
                                                <Icons.ArrowDown />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
                <div className="max-w-2xl mx-auto w-full flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition">Hủy</button>
                    <button 
                        onClick={() => {
                            const finalOrder = orderedParts.filter(id => localSelected.includes(id));
                            onSave(finalOrder);
                        }} 
                        className="flex-1 py-4 font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition"
                    >
                        Lưu cấu hình
                    </button>
                </div>
            </div>
        </div>
    );
});

var OverviewScreen = React.memo(({ ThemeToggleBtn, Notification, quizTitle, timeLimit, setTimeLimit, currentQuizCode, copyToClipboard, config, setConfig, prepareQuiz, isReadOnly, navigate, cloneQuizAdmin, cloneCooldown, currentUser, parsedData }) => {
    const [showShuffleMenu, setShowShuffleMenu] = useState(false);
    const [showTimeMenu, setShowTimeMenu] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const isAdmin = currentUser?.username.toLowerCase() === ADMIN_USERNAME;
    const isVip = currentUser?.isVip || false;

    const shuffleOptions = [
        { id: 'none', label: 'Giữ nguyên thứ tự' },
        { id: 'questions', label: 'Chỉ trộn câu hỏi' },
        { id: 'options', label: 'Chỉ trộn đáp án' },
        { id: 'both', label: 'Trộn tất cả' }
    ];
    const fullLink = `${window.location.origin}${window.location.pathname}#/Overview/${currentQuizCode}`;

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

    const availableParts = useMemo(() => {
        if (!parsedData) return [];
        const parts = [];
        if (parsedData.mc && parsedData.mc.length > 0) parts.push({ id: 'mc', label: 'I. Trắc nghiệm' });
        if (parsedData.tf && parsedData.tf.length > 0) parts.push({ id: 'tf', label: 'II. Đúng/Sai' });
        if (parsedData.sa && parsedData.sa.length > 0) parts.push({ id: 'sa', label: 'III. Trả lời ngắn' });
        if (parsedData.rc && parsedData.rc.length > 0) parts.push({ id: 'rc', label: 'IV. Đọc hiểu' });
        return parts;
    }, [parsedData]);

    useEffect(() => {
        if ((!config.selectedSections || config.selectedSections.length === 0) && availableParts.length > 0) {
            setConfig(prev => ({ ...prev, selectedSections: availableParts.map(p => p.id) }));
        }
    }, [availableParts, config.selectedSections, setConfig]);

    return (
        <div className="min-h-screen p-4 py-10 md:p-8 animate-fade-in bg-slate-100 dark:bg-slate-900 transition-colors flex items-start sm:items-center justify-center">
        <Notification />
        
        {showOrderModal && (
            <SectionOrderModal 
                availableParts={availableParts} 
                initialSelected={config.selectedSections} 
                onClose={() => setShowOrderModal(false)}
                onSave={(newOrder) => {
                    setConfig({...config, selectedSections: newOrder});
                    setShowOrderModal(false);
                }}
                ThemeToggleBtn={ThemeToggleBtn}
                quizTitle={quizTitle}
                quizCode={currentQuizCode}
            />
        )}

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
                <div className="w-full flex flex-col items-center border-b border-slate-100 dark:border-slate-700 pb-6">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Chế độ thi</p>
                <div className="flex w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 gap-1.5 border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setConfig({...config, mode: 'single'})} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${config.mode === 'single' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Từng câu</button>
                    <button onClick={() => setConfig({...config, mode: 'all'})} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${config.mode === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Tất cả</button>
                </div>
                </div>
                
                <div className="w-full flex flex-col items-center relative border-b border-slate-100 dark:border-slate-700 py-6">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Xáo trộn</p>
                <div className="w-full">
                    <button 
                        onClick={() => setShowShuffleMenu(!showShuffleMenu)} 
                        className="w-full flex items-center justify-between py-4 px-5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm"
                    >
                        <span className="truncate flex-1 text-center pl-5">{shuffleOptions.find(o => o.id === config.shuffle)?.label || 'Giữ nguyên'}</span>
                        <div className={`transition-transform duration-200 text-slate-400 shrink-0 ${showShuffleMenu ? 'rotate-180' : ''}`}>
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
                                        className={`w-full text-center px-5 py-4 font-bold transition-colors ${config.shuffle === opt.id ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                </div>

                <div className="w-full flex flex-col items-center relative border-b border-slate-100 dark:border-slate-700 py-6">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Thời gian làm bài</p>
                <div className="w-full relative">
                    <button onClick={() => setShowTimeMenu(!showTimeMenu)} className="w-full flex items-center justify-between py-4 px-5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 outline-none transition-colors shadow-sm text-sm sm:text-base">
                        <span className="truncate flex-1 text-center pl-5">{h > 0 || m > 0 || s > 0 ? `${h} giờ ${m} phút ${s} giây` : 'Không giới hạn'}</span>
                        <div className={`transition-transform duration-200 text-slate-400 shrink-0 ${showTimeMenu ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
                    </button>
                    {showTimeMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowTimeMenu(false)}></div>
                            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in flex p-2 gap-2 h-60">
                                {/* Giờ */}
                                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                    <div className="text-center font-black text-[10px] text-slate-400 mb-2 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur py-1 z-10">GIỜ</div>
                                    {[...Array(13)].map((_, i) => <button key={`h${i}`} onClick={() => updateTime('h', i)} className={`w-full py-2.5 rounded-xl font-bold transition-colors text-xs sm:text-sm mb-1 ${h === i ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{i}</button>)}
                                </div>
                                {/* Phút */}
                                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden border-l border-slate-100 dark:border-slate-700" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                    <div className="text-center font-black text-[10px] text-slate-400 mb-2 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur py-1 z-10">PHÚT</div>
                                    {[...Array(60)].map((_, i) => <button key={`m${i}`} onClick={() => updateTime('m', i)} className={`w-full py-2.5 rounded-xl font-bold transition-colors text-xs sm:text-sm mb-1 ${m === i ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{i}</button>)}
                                </div>
                                {/* Giây */}
                                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden border-l border-slate-100 dark:border-slate-700" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                    <div className="text-center font-black text-[10px] text-slate-400 mb-2 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur py-1 z-10">GIÂY</div>
                                    {[...Array(60)].map((_, i) => <button key={`s${i}`} onClick={() => updateTime('s', i)} className={`w-full py-2.5 rounded-xl font-bold transition-colors text-xs sm:text-sm mb-1 ${s === i ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{i}</button>)}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                </div>

                {availableParts.length > 0 && (
                    <div className="w-full flex flex-col items-center relative pt-6">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider text-center">Chọn phần thi & Thứ tự</p>
                    
                    <button 
                        onClick={() => setShowOrderModal(true)}
                        className="w-full flex items-center justify-between py-4 px-5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold border border-indigo-200 dark:border-indigo-800 outline-none transition-colors shadow-sm"
                    >
                        <span className="truncate flex-1 text-center pl-5">Cài đặt phần thi ({config.selectedSections?.length || 0})</span>
                        <div className="text-indigo-400 shrink-0"><Icons.Edit /></div>
                    </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <button onClick={prepareQuiz} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-lg transform hover:-translate-y-1"><Icons.Play /> BẮT ĐẦU THI</button>
                {!isReadOnly && (
                <div className="flex gap-3">
                    <button onClick={() => navigate(`Overview/${currentQuizCode}/EditText`)} className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow transition text-sm">Sửa Text Gốc</button>
                    <button onClick={() => navigate(`Overview/${currentQuizCode}/EditQuestion`)} className="flex-1 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow transition text-sm">Sửa Câu Hỏi</button>
                </div>
                )}
                {isReadOnly && (isAdmin || isVip) && (
                    <button onClick={() => cloneQuizAdmin()} disabled={cloneCooldown > 0} className={`w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-4 rounded-xl transition shadow flex items-center justify-center gap-2 ${cloneCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}><Icons.Copy /> {cloneCooldown > 0 ? `Vui lòng đợi ${cloneCooldown}s...` : `Nhân bản thành đề của tôi ${isAdmin ? '(Admin)' : '(VIP)'}`}</button>
                )}
                <button onClick={() => navigate(currentUser ? 'Home' : 'Login')} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold py-4 rounded-xl border border-slate-200 dark:border-slate-700 transition">Thoát</button>
            </div>
        </div>
        </div>
    );
});

var SettingsScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, parsedData, setParsedData, editingQ, setEditingQ, navigate, currentQuizCode, isReadOnly, currentUser, db, handleImageUpload, changeQuestionType, saveInlineEdit, removeInlineQuestion, handleAddNewQuestion, showMessage, quizzesPath, quizTitle, setShowGuestSaveModal }) => {
    const [qSearchTerm, setQSearchTerm] = useState('');
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const [showAddSectionSelector, setShowAddSectionSelector] = useState(false);

    const totalQuestions = useMemo(() => {
        let count = 0;
        if (parsedData.mc) count += parsedData.mc.length;
        if (parsedData.tf) count += parsedData.tf.length;
        if (parsedData.sa) count += parsedData.sa.length;
        if (parsedData.rc) parsedData.rc.forEach(q => count += q.subQuestions.length);
        return count;
    }, [parsedData]);

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

    const handleOptImageUpload = async (file, optId, isSubQ = false, subQId = null) => {
        if (!file) return;
        if (file.size > 32 * 1024 * 1024) return showMessage("Ảnh quá lớn! Vui lòng chọn ảnh < 32MB.", "error");
        showMessage("Đang tải ảnh phương án lên...", "success");
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST', body: formData
            });
            const data = await response.json();
            if (data.success) {
                const imageUrl = data.data.url;
                let newOpts = isSubQ ? [...editingQ.data.subQuestions.find(sq => sq.id === subQId).options] : [...editingQ.data.options];
                const optIndex = newOpts.findIndex(o => o.id === optId);
                if (optIndex > -1) newOpts[optIndex].image = imageUrl;

                if (isSubQ) {
                    const newSqs = [...editingQ.data.subQuestions];
                    const sqIndex = newSqs.findIndex(sq => sq.id === subQId);
                    newSqs[sqIndex].options = newOpts;
                    setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                } else {
                    setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                }
                showMessage("Tải ảnh phương án thành công!", "success");
            } else showMessage("Lỗi tải ảnh!", "error");
        } catch (e) { showMessage("Lỗi kết nối!", "error"); }
    };

    const removeOptImage = (optId, isSubQ = false, subQId = null) => {
        let newOpts = isSubQ ? [...editingQ.data.subQuestions.find(sq => sq.id === subQId).options] : [...editingQ.data.options];
        const optIndex = newOpts.findIndex(o => o.id === optId);
        if (optIndex > -1) newOpts[optIndex].image = null;

        if (isSubQ) {
            const newSqs = [...editingQ.data.subQuestions];
            const sqIndex = newSqs.findIndex(sq => sq.id === subQId);
            newSqs[sqIndex].options = newOpts;
            setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
        } else {
            setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
        }
    };

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
                    <AutoResizingTextarea 
                        value={editingQ.data.text} 
                        onChange={val => setEditingQ({...editingQ, data: {...editingQ.data, text: val}})} 
                        className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white dark:border-slate-600 outline-none resize-none overflow-hidden" 
                        rows="1" 
                    />
                </div>
                {editingQ.data.type !== 'rc' && (
                    <div className="space-y-3">
                    {editingQ.data.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-start gap-3">
                        {editingQ.data.type === 'tf' ? (
                            <div className="flex gap-1 mt-1 shrink-0 flex-col sm:flex-row">
                            <button onClick={() => {
                                const newOpts = [...editingQ.data.options]; newOpts[oIdx].isCorrect = true;
                                setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                            }} className={`px-2.5 py-1.5 text-xs font-bold rounded shadow-sm transition-colors ${opt.isCorrect ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'}`}>Đúng</button>
                            <button onClick={() => {
                                const newOpts = [...editingQ.data.options]; newOpts[oIdx].isCorrect = false;
                                setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                            }} className={`px-2.5 py-1.5 text-xs font-bold rounded shadow-sm transition-colors ${!opt.isCorrect ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'}`}>Sai</button>
                            </div>
                        ) : (
                            editingQ.data.type !== 'sa' && <input 
                                type="radio" 
                                checked={opt.isCorrect} 
                                onChange={() => {
                                const newOpts = editingQ.data.options.map(o => ({...o, isCorrect: o.id === opt.id}));
                                setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                                }} 
                                className="mt-3 w-5 h-5 cursor-pointer text-blue-600" 
                            />
                        )}
                        <div className="flex-1 flex flex-col min-w-0">
                            <AutoResizingTextarea 
                                value={opt.text} 
                                onChange={val => {
                                    const newOpts = [...editingQ.data.options]; newOpts[oIdx].text = val;
                                    setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                                }} 
                                className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-slate-600 outline-none resize-none overflow-hidden" 
                                rows="1" 
                            />
                            {opt.image && (
                                <div className="relative mt-2 inline-block self-start">
                                    <img src={opt.image} className="h-24 w-auto object-contain rounded border border-slate-200 dark:border-slate-700" />
                                    <button onClick={() => removeOptImage(opt.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600">×</button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-1 shrink-0">
                            {editingQ.data.type !== 'sa' && (
                                <label className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition cursor-pointer flex items-center justify-center" title="Thêm ảnh cho phương án">
                                    <Icons.Image />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOptImageUpload(e.target.files[0], opt.id)} />
                                </label>
                            )}
                            <button onClick={() => {
                                const newOpts = editingQ.data.options.filter(o => o.id !== opt.id);
                                setEditingQ({...editingQ, data: {...editingQ.data, options: newOpts}});
                            }} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-lg transition flex items-center justify-center" title="Xóa phương án này"><Icons.Trash /></button>
                        </div>
                        </div>
                    ))}
                    <button onClick={() => {
                        const newOpts = [...editingQ.data.options, {id: generateId(), text: '', isCorrect: editingQ.data.options.length === 0, image: null}];
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

                        <AutoResizingTextarea 
                            value={sq.text} 
                            onChange={val => {
                                const newSqs = [...editingQ.data.subQuestions]; newSqs[sqIdx].text = val;
                                setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                            }} 
                            className="w-full pr-20 p-2 mb-2 border rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-600 font-bold outline-none resize-none overflow-hidden" 
                            rows="1" 
                        />
                        {sq.options.map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-start gap-2 mb-3 pl-2">
                            <input type="radio" checked={opt.isCorrect} onChange={() => {
                                const newSqs = [...editingQ.data.subQuestions];
                                newSqs[sqIdx].options = sq.options.map(o => ({...o, isCorrect: o.id === opt.id}));
                                setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                            }} className="mt-2 w-4 h-4 text-blue-600 cursor-pointer shrink-0" />
                            <div className="flex-1 flex flex-col min-w-0">
                                <AutoResizingTextarea 
                                    value={opt.text} 
                                    onChange={val => {
                                        const newSqs = [...editingQ.data.subQuestions];
                                        newSqs[sqIdx].options[oIdx].text = val;
                                        setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                                    }} 
                                    className="w-full text-sm p-1.5 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600 outline-none resize-none overflow-hidden" 
                                    rows="1" 
                                />
                                {opt.image && (
                                    <div className="relative mt-2 inline-block self-start">
                                        <img src={opt.image} className="h-20 w-auto object-contain rounded border border-slate-200 dark:border-slate-700" />
                                        <button onClick={() => removeOptImage(opt.id, true, sq.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow hover:bg-red-600">×</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                                <label className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded transition cursor-pointer flex items-center justify-center" title="Thêm ảnh">
                                    <Icons.Image />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOptImageUpload(e.target.files[0], opt.id, true, sq.id)} />
                                </label>
                                <button onClick={() => {
                                    const newSqs = [...editingQ.data.subQuestions];
                                    newSqs[sqIdx].options = newSqs[sqIdx].options.filter(o => o.id !== opt.id);
                                    setEditingQ({...editingQ, data: {...editingQ.data, subQuestions: newSqs}});
                                }} className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded transition flex items-center justify-center"><Icons.Trash /></button>
                            </div>
                            </div>
                        ))}
                        <button onClick={() => {
                            const newSqs = [...editingQ.data.subQuestions];
                            newSqs[sqIdx].options.push({id: generateId(), text: '', isCorrect: newSqs[sqIdx].options.length === 0, image: null});
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
            <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                <button onClick={() => navigate(`Overview/${currentQuizCode}`)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition shrink-0"><Icons.ArrowLeft /></button>
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black dark:text-white truncate" title={quizTitle}>{quizTitle}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">Tổng cộng: {totalQuestions} câu hỏi</p>
                </div>
            </div>
            <div className="flex w-full md:w-auto gap-3 flex-1 md:justify-end">
                <div className="relative w-full max-w-sm">
                    <input type="text" placeholder="Tìm số/tên câu..." value={qSearchTerm} onChange={(e) => setQSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium dark:text-white transition-colors" />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
                </div>
                {!isReadOnly && (
                <>
                {currentUser?.isGuest && (
                    <button onClick={() => setShowGuestSaveModal(true)} className="flex items-center justify-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 transition px-4 py-2.5 rounded-xl font-bold text-sm shrink-0">
                        <Icons.User /> <span className="hidden sm:inline">Lưu vào TK</span>
                    </button>
                )}
                <button onClick={() => {
                    if (currentUser && !currentUser.isGuest && currentQuizCode && db) {
                        db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: parsedData })
                        .then(() => showMessage("Đã lưu đề thi thành công!", "success"))
                        .catch(() => showMessage("Lỗi khi lưu đề thi!", "error"));
                    } else {
                        showMessage("Đề của bạn đang ở trạng thái lưu tạm!", "success");
                    }
                }} className="flex items-center justify-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition px-4 py-2.5 rounded-xl font-bold text-sm shrink-0">
                    <Icons.Check /> <span className="hidden sm:inline">Lưu</span>
                </button>
                <button onClick={() => setShowAddSectionSelector(true)} className="flex items-center justify-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition px-4 py-2.5 rounded-xl font-bold text-sm shrink-0">
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
                            <div className="mt-3 space-y-2 pl-2 sm:pl-3 border-l-2 border-slate-100 dark:border-slate-700">
                                {q.options.map(opt => (
                                    <div key={opt.id} className={`text-sm flex flex-col items-start gap-1 ${opt.isCorrect ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    <div className="flex items-start gap-2">
                                        <span className="shrink-0 pt-0.5">{opt.isCorrect ? '✓' : '○'}</span>
                                        <span className="break-words whitespace-pre-wrap">{opt.text}</span>
                                    </div>
                                    {opt.image && <img src={opt.image} className="h-20 w-auto ml-5 rounded object-contain border border-slate-200 dark:border-slate-700" />}
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isReadOnly && q.type === 'sa' && <div className="text-sm text-green-700 dark:text-green-400 mt-2 font-bold bg-green-50 dark:bg-green-900/30 p-2 rounded inline-block break-words border border-green-100 dark:border-green-800 whitespace-pre-wrap">Đ.án: {q.options[0]?.text || '(Chưa nhập)'}</div>}
                        {q.type === 'rc' && (
                        <div className="mt-4 space-y-4 pl-4 border-l-4 border-slate-200 dark:border-slate-600 min-w-0">
                            {q.subQuestions.map((sq, sIdx) => (
                            <div key={sq.id} className="min-w-0">
                                <div className="font-bold text-slate-600 dark:text-slate-400 break-words whitespace-pre-wrap">#{sIdx + 1}: {sq.text}</div>
                                <div className="mt-2 space-y-2 pl-2">
                                    {!isReadOnly && sq.options.filter(o=>o.isCorrect).map(o => (
                                    <div key={o.id} className="text-sm flex flex-col items-start gap-1 text-green-600 dark:text-green-400 font-bold">
                                        <div className="break-words whitespace-pre-wrap">Đ.án: {o.text}</div>
                                        {o.image && <img src={o.image} className="h-16 w-auto rounded object-contain border border-green-200 dark:border-green-800" />}
                                    </div>
                                    ))}
                                </div>
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
                            <Icons.Image /> Ảnh câu hỏi
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
                    {sections.map(s => <button key={s.id} onClick={() => { handleAddNewQuestion(s.id); setShowAddSectionSelector(false); }} className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-bold dark:text-white border dark:border-slate-700 transition">{s.title}</button>)}
                </div>
                <button onClick={() => setShowAddSectionSelector(false)} className="w-full mt-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition font-bold rounded-xl dark:text-white">Hủy</button>
                </div>
            </div>
        )}
        </div>
    );
});

var ResultScreen = React.memo(({ ThemeToggleBtn, score, prepareQuiz, navigate, currentUser, endRemark, incorrectData, prepareRedoIncorrectQuiz }) => {
    const hasIncorrect = incorrectData && (
        (incorrectData.mc && incorrectData.mc.length > 0) ||
        (incorrectData.tf && incorrectData.tf.length > 0) ||
        (incorrectData.sa && incorrectData.sa.length > 0) ||
        (incorrectData.rc && incorrectData.rc.length > 0)
    );

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
            {hasIncorrect && (
                <button onClick={prepareRedoIncorrectQuiz} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition whitespace-nowrap truncate min-w-0 px-2">Làm lại những câu sai</button>
            )}
            <button onClick={prepareQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition whitespace-nowrap truncate min-w-0 px-2">Làm lại toàn bộ</button>
            <button onClick={() => navigate(currentUser ? 'Home' : 'Login')} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-xl transition-colors whitespace-nowrap truncate min-w-0 px-2">Thoát</button>
            </div>
        </div>
        </div>
    );
});