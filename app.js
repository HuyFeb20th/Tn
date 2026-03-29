const { useState, useEffect, useCallback, useMemo } = React;

window.MainApp = function() {
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);
    const [isFetchingQuiz, setIsFetchingQuiz] = useState(false);
    const [cloneCooldown, setCloneCooldown] = useState(0);

    useEffect(() => {
        if (cloneCooldown > 0) {
            const timer = setTimeout(() => setCloneCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cloneCooldown]);

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
    setHash(path);
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
    
    const [recentQuizzes, setRecentQuizzes] = useState([]);
    const [localCreatedQuizzes, setLocalCreatedQuizzes] = useState([]);
    const [incorrectData, setIncorrectData] = useState(null);

    useEffect(() => {
        if (!currentUser || !db || currentUser.isGuest) return;
        const usernameLower = currentUser.username.toLowerCase();
        const unsub = db.doc(`${usersPath}/${usernameLower}`).onSnapshot(snap => {
            if (snap.exists) {
                const data = snap.data();
                if (currentUser.isVip !== !!data.isVip) {
                    setCurrentUser(prev => ({...prev, isVip: !!data.isVip}));
                }
            }
        });
        return () => unsub();
    }, [currentUser?.username, currentUser?.isGuest]);

    useEffect(() => {
        if (currentUser) localStorage.setItem('quiz_current_user', JSON.stringify(currentUser));
        else localStorage.removeItem('quiz_current_user');
    }, [currentUser]);

    useEffect(() => {
        try {
            const savedRecents = JSON.parse(localStorage.getItem('quiz_recent_history') || '[]');
            const validRecents = savedRecents.filter(r => (Date.now() - r.savedAt) < 86400000);
            if (validRecents.length !== savedRecents.length) {
                localStorage.setItem('quiz_recent_history', JSON.stringify(validRecents));
            }
            setRecentQuizzes(validRecents);

            const savedLocals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
            const validLocals = savedLocals.filter(q => q.expiresAt > Date.now());
            if (validLocals.length !== savedLocals.length) {
                localStorage.setItem('quiz_local_created', JSON.stringify(validLocals));
            }
            setLocalCreatedQuizzes(validLocals);
        } catch(e) {}
    }, [activeScreen]);

    const saveToRecentHistory = useCallback((quizCode, title, data, timeStr) => {
        if (!quizCode || quizCode === 'draft') return;
        try {
            let recents = JSON.parse(localStorage.getItem('quiz_recent_history') || '[]');
            recents = recents.filter(r => r.code !== quizCode && (Date.now() - r.savedAt < 86400000));
            recents.unshift({ code: quizCode, title: title || 'Đề thi', parsedData: data, timeLimit: timeStr, savedAt: Date.now() });
            if (recents.length > 5) recents.pop();
            localStorage.setItem('quiz_recent_history', JSON.stringify(recents));
            setRecentQuizzes(recents);
        } catch(e) {}
    }, []);

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
    const [showGuestSaveModal, setShowGuestSaveModal] = useState(false);

    const [saveCooldown, setSaveCooldown] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const [config, setConfig] = useState({ mode: 'single', shuffle: 'none', selectedSections: [] });
    const [activeQuiz, setActiveQuiz] = useState({ mc: [], tf: [], sa: [], rc: [], flat: [] });
    const [answers, setAnswers] = useState({}); 
    const [currentIndex, setCurrentIndex] = useState(0); 
    const [isSubmitted, setIsSubmitted] = useState(false); 
    const [singleQuestionConfirmed, setSingleQuestionConfirmed] = useState(false); 
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [endRemark, setEndRemark] = useState('');

    const displayQuizzes = useMemo(() => {
        const map = new Map();
        localCreatedQuizzes.forEach(q => map.set(q.code, {...q, isLocal: true}));
        if (currentUser && !currentUser.isGuest) {
            myQuizzes.forEach(q => map.set(q.code, {...q, isLocal: false}));
        }
        return Array.from(map.values()).sort((a,b) => b.createdAt - a.createdAt);
    }, [myQuizzes, localCreatedQuizzes, currentUser]);

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

    // AUTO-SAVE QUÍZ STATE (Lưu trạng thái bài thi mỗi khi thay đổi)
    useEffect(() => {
        if (activeScreen === 'quiz' && currentQuizCode && activeQuiz.flat.length > 0) {
            const sessionData = { activeQuiz, answers, currentIndex, isSubmitted, singleQuestionConfirmed, score };
            localStorage.setItem(`quiz_session_${currentQuizCode}`, JSON.stringify(sessionData));
        }
    }, [activeQuiz, answers, currentIndex, isSubmitted, singleQuestionConfirmed, score, activeScreen, currentQuizCode]);

    const showMessage = useCallback((text, type = 'error') => {
        setGlobalMessage({ text, type });
        setTimeout(() => setGlobalMessage({ text: '', type: 'error' }), 3500);
    }, []);

    // AUTO-RESTORE QUIZ STATE (Khôi phục bài thi nếu lỡ F5)
    useEffect(() => {
        if (activeScreen === 'quiz' && activeQuiz.flat.length === 0 && currentQuizCode) {
            const savedSession = localStorage.getItem(`quiz_session_${currentQuizCode}`);
            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    setActiveQuiz(parsed.activeQuiz);
                    setAnswers(parsed.answers);
                    setCurrentIndex(parsed.currentIndex);
                    setIsSubmitted(parsed.isSubmitted);
                    setSingleQuestionConfirmed(parsed.singleQuestionConfirmed);
                    setScore(parsed.score);
                    showMessage("Đã khôi phục trạng thái làm bài!", "success");
                } catch(e) {
                    navigate(`Overview/${currentQuizCode}`);
                }
            } else {
                navigate(`Overview/${currentQuizCode}`);
            }
        }
    }, [activeScreen, currentQuizCode, activeQuiz.flat.length, navigate, showMessage]);

    const clearQuizSession = useCallback(() => {
        if (currentQuizCode) {
            localStorage.removeItem(`quiz_session_${currentQuizCode}`);
            localStorage.removeItem(`quiz_timer_${currentQuizCode}`);
        }
    }, [currentQuizCode]);

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
                            const isOwner = currentUser && !currentUser.isGuest && currentUser.username.toLowerCase() === data.owner;
                            setIsReadOnly(!isOwner);
                        } else {
                            throw new Error("EXPIRED");
                        }
                    } else {
                        throw new Error("NOT_FOUND");
                    }
                    setIsFetchingQuiz(false);
                }).catch((err) => {
                    const locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
                    const foundLocalCreated = locals.find(q => q.code === urlCode && q.expiresAt > Date.now());
                    
                    if (foundLocalCreated) {
                        setParsedData(foundLocalCreated.parsedData);
                        if (foundLocalCreated.rawTexts) setRawTexts(foundLocalCreated.rawTexts);
                        setQuizTitle(foundLocalCreated.title);
                        setTimeLimit(foundLocalCreated.timeLimit);
                        setCurrentQuizCode(urlCode);
                        setIsReadOnly(false);
                        showMessage("Đang xem bản lưu tạm cục bộ.", "warning");
                    } else {
                        const recents = JSON.parse(localStorage.getItem('quiz_recent_history') || '[]');
                        const foundLocal = recents.find(r => r.code === urlCode && (Date.now() - r.savedAt < 86400000));
                        
                        if (foundLocal) {
                            setParsedData(foundLocal.parsedData);
                            if (foundLocal.rawTexts) setRawTexts(foundLocal.rawTexts);
                            setQuizTitle(foundLocal.title);
                            setTimeLimit(foundLocal.timeLimit);
                            setCurrentQuizCode(urlCode);
                            setIsReadOnly(true);
                            showMessage("Đang xem bản lưu tạm cục bộ.", "warning");
                        } else {
                            showMessage(err.message === "EXPIRED" ? "Đề thi đã hết hạn!" : "Không tìm thấy mã đề hoặc đã bị xóa!");
                            navigate('Login');
                        }
                    }
                    setIsFetchingQuiz(false);
                });
            }
        }
    }, [urlCode, currentRoute, currentUser, currentQuizCode, navigate, fbUser]);

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
    if (!fbUser || !currentUser || currentUser.isGuest || !db) return;
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
    }, [fbUser, currentUser]);

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
            setCurrentUser({ username: userSnap.data().username, isVip: !!userSnap.data().isVip }); navigate('Home');
        } else showMessage("Sai mật khẩu!");
        } else {
        await userRef.set({ username: uname, password: pwd, isVip: false });
        setCurrentUser({ username: uname, isVip: false }); navigate('Home');
        showMessage("Tạo tài khoản thành công!", "success");
        }
    } catch (error) { 
        showMessage("Kết nối không ổn định. Vui lòng kiểm tra mạng và thử lại!", "error"); 
    }
    };

    const handleGuestLogin = () => {
        setCurrentUser({ username: 'Khách', isVip: false, isGuest: true });
        navigate('Home');
        showMessage("Đã vào bằng chế độ Khách!", "success");
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

    const handleDeleteQuiz = (q) => {
        if (q.isLocal) {
            let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
            locals = locals.filter(item => item.id !== q.id);
            localStorage.setItem('quiz_local_created', JSON.stringify(locals));
            setLocalCreatedQuizzes(locals);
            showMessage("Đã xóa đề lưu tạm trên máy!", "success");
            
            if (currentQuizCode === q.code) {
                resetQuiz();
            }
        } else {
            db.doc(`${quizzesPath}/${q.id}`).delete().then(() => {
                showMessage("Đã xóa!", "success");
                if (currentQuizCode === q.code) resetQuiz();
            }).catch(() => showMessage("Lỗi xóa đề!", "error"));
        }
    };

    const handleExtendQuiz = (q) => {
        const newExpiry = Math.min(q.expiresAt + 7*86400000, q.createdAt + 50*86400000);
        if (q.isLocal) {
            let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
            const idx = locals.findIndex(item => item.id === q.id);
            if (idx >= 0) {
                locals[idx].expiresAt = newExpiry;
                localStorage.setItem('quiz_local_created', JSON.stringify(locals));
                setLocalCreatedQuizzes(locals);
                showMessage("Đã gia hạn đề lưu trên máy!", "success");
            }
        } else {
            db.doc(`${quizzesPath}/${q.id}`).update({ expiresAt: newExpiry }).then(() => showMessage("Đã gia hạn!", "success")).catch(() => showMessage("Lỗi gia hạn!", "error"));
        }
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
            throw new Error("NOT_FOUND");
        }
    } catch (error) {
        const locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
        const foundLocalCreated = locals.find(q => q.code === code && q.expiresAt > Date.now());
        if (foundLocalCreated) {
            setParsedData(foundLocalCreated.parsedData);
            if (foundLocalCreated.rawTexts) setRawTexts(foundLocalCreated.rawTexts);
            setQuizTitle(foundLocalCreated.title);
            setTimeLimit(foundLocalCreated.timeLimit);
            setCurrentQuizCode(code);
            setIsReadOnly(false);
            navigate(`Overview/${code}`);
            showMessage("Đang xem bản lưu tạm cục bộ.", "warning");
            return;
        }

        const recents = JSON.parse(localStorage.getItem('quiz_recent_history') || '[]');
        const foundLocal = recents.find(r => r.code === code && (Date.now() - r.savedAt < 86400000));
        if (foundLocal) {
            setParsedData(foundLocal.parsedData);
            if (foundLocal.rawTexts) setRawTexts(foundLocal.rawTexts);
            setQuizTitle(foundLocal.title);
            setTimeLimit(foundLocal.timeLimit);
            setCurrentQuizCode(code);
            setIsReadOnly(true);
            navigate(`Overview/${code}`);
            showMessage("Đang xem bản lưu tạm cục bộ.", "warning");
        } else {
            showMessage(error.message === "NOT_FOUND" ? "Mã không đúng hoặc đề không tồn tại!" : "Lỗi kết nối máy chủ!");
        }
    }
    };

    const cloneQuizAdmin = async (customParsed, customTitle, customRaw) => {
        if (cloneCooldown > 0) {
            showMessage(`Vui lòng đợi ${cloneCooldown}s để tiếp tục Copy!`, "warning");
            return;
        }
        if (!db || !currentUser || currentUser.isGuest) {
            showMessage("Hãy đăng nhập tài khoản để copy đề!", "warning");
            return;
        }
        
        const newCode = generateShareCode();
        const usernameLower = currentUser.username.toLowerCase();
        const clonedTitle = `${customTitle || quizTitle || 'Đề thi'} (Copy)`;
        let trimmedTitle = clonedTitle.length > 15 ? clonedTitle.substring(0, 15) : clonedTitle;
        const dataToClone = customParsed || parsedData;
        const rawToClone = customRaw || rawTexts;
        
        setCloneCooldown(15); 
        
        try {
            await db.doc(`${quizzesPath}/${newCode}`).set({
                code: newCode, owner: usernameLower, title: trimmedTitle, parsedData: dataToClone, rawTexts: rawToClone,
                createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, timeLimit: timeLimit
            });
            showMessage("Nhân bản thành công!", "success");
            if (!customParsed) {
                setCurrentQuizCode(newCode); setIsReadOnly(false); setQuizTitle(trimmedTitle);
                navigate(`Overview/${newCode}`);
            }
        } catch(e) { showMessage("Lỗi nhân bản!"); setCloneCooldown(0); }
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
        const optObj = { id: generateId(), text: optMatch[3], isCorrect: optMatch[1] === '*', image: null };
        if (currentSubQ) currentSubQ.options.push(optObj);
        else if (currentQ) { currentQ.options.push(optObj); if (!currentQ.type) currentQ.type = 'mc'; }
        continue;
        }
        const saMatch = line.match(/^\*\s*(.+?)\s*\*$/);
        if (saMatch && currentQ && !currentSubQ && currentQ.options.length === 0) {
        currentQ.type = 'sa'; currentQ.options.push({ id: generateId(), text: saMatch[1], isCorrect: true, image: null }); continue;
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

    const processAndSaveQuizzes = async (overrideUser = null) => {
    if(saveCooldown > 0 || isSaving) return; 
    setIsSaving(true); 
    const activeUser = overrideUser || currentUser;

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
    
    const restoreImages = (newArr, oldArr) => {
        newArr.forEach(newQ => {
            const oldQ = oldArr.find(oq => oq.text === newQ.text);
            if (oldQ) {
                newQ.image = oldQ.image;
                newQ.options.forEach((nOpt, idx) => {
                    if (oldQ.options[idx]) nOpt.image = oldQ.options[idx].image;
                });
                if (newQ.type === 'rc') {
                    newQ.subQuestions.forEach((nSq, sqIdx) => {
                        if (oldQ.subQuestions[sqIdx]) {
                            nSq.options.forEach((nOpt, oIdx) => {
                                if (oldQ.subQuestions[sqIdx].options[oIdx]) nOpt.image = oldQ.subQuestions[sqIdx].options[oIdx].image;
                            });
                        }
                    });
                }
            }
        });
    };
    
    restoreImages(allMC, parsedData.mc || []);
    restoreImages(allTF, parsedData.tf || []);
    restoreImages(allSA, parsedData.sa || []);
    restoreImages(allRC, parsedData.rc || []);

    const newParsedData = { mc: allMC, tf: allTF, sa: allSA, rc: allRC };
    setParsedData(newParsedData);
    let finalCode = currentQuizCode || generateShareCode();
    let isSavedToCloud = false;

    let finalTitle = quizTitle.trim();
    if (!finalTitle) {
        const targetText = rawTexts.file ? rawTexts.file : (rawTexts.mc || rawTexts.tf || rawTexts.sa || rawTexts.rc);
        const firstLine = (targetText || "").split('\n').find(l => l.trim().length > 0);
        if(firstLine) finalTitle = firstLine.length > 15 ? firstLine.substring(0, 15) : firstLine;
        else finalTitle = "Đề thi mới";
        setQuizTitle(finalTitle);
    }

    const parsedTimeLimit = parseInt(timeLimit) || 0;

    if (activeUser && !activeUser.isGuest && db && !isReadOnly) {
        const usernameLower = activeUser.username.toLowerCase();
        const isAdmin = usernameLower === ADMIN_USERNAME;
        const isVip = activeUser.isVip || false;
        
        if (!isAdmin && !currentQuizCode) {
            const userQuizzesCount = myQuizzes.length; 
            const currentLimit = isVip ? MAX_QUIZZES_PER_VIP : MAX_QUIZZES_PER_USER;
            if (userQuizzesCount >= currentLimit) {
            showMessage(`Đạt giới hạn ${currentLimit} đề. Đề thi sẽ được lưu tạm.`, "error");
            } else {
                isSavedToCloud = true;
            }
        } else {
            isSavedToCloud = true;
        }

        if (isSavedToCloud) {
            try {
                const savePromise = db.doc(`${quizzesPath}/${finalCode}`).set({ 
                    code: finalCode, owner: usernameLower, title: finalTitle, parsedData: newParsedData, rawTexts, 
                    createdAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
                    timeLimit: parsedTimeLimit
                }, {merge: true});

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("TIMEOUT_ERROR")), 15000); 
                });

                await Promise.race([savePromise, timeoutPromise]);
                showMessage("Đã lưu vào Kho đám mây!", "success");
                
                let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
                locals = locals.filter(item => item.code !== finalCode);
                localStorage.setItem('quiz_local_created', JSON.stringify(locals));
                setLocalCreatedQuizzes(locals);
            } catch (e) {
                console.error("Lỗi khi lưu lên Firestore:", e);
                isSavedToCloud = false;
            }
        }
    }
    
    if (!isSavedToCloud && !isReadOnly) {
        try {
            let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
            const existingIdx = locals.findIndex(q => q.code === finalCode);
            const localQuizObj = {
                id: finalCode, code: finalCode, owner: 'Khách', title: finalTitle,
                parsedData: newParsedData, rawTexts, createdAt: Date.now(),
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, timeLimit: parsedTimeLimit
            };
            if (existingIdx >= 0) locals[existingIdx] = localQuizObj;
            else locals.unshift(localQuizObj);
            localStorage.setItem('quiz_local_created', JSON.stringify(locals));
            setLocalCreatedQuizzes(locals);
            showMessage("Đề đã được lưu tạm, hãy Lưu vào TK để không bị mất dữ liệu.", "warning");
        } catch(e) {}
    }

    setIsSaving(false); 
    setCurrentQuizCode(finalCode);
    navigate(`Overview/${finalCode}`); 
    };

    const handleParseAndSave = () => {
    if (saveCooldown > 0 || isSaving) return;
    if (currentRoute === 'overview' && urlAction === 'edittext') {
        setCustomAlert({
            isOpen: true, title: "Bạn có muốn lưu text này không?", message: "Tất cả hình ảnh đã tải lên và các thay đổi trong phần \"Sửa câu hỏi\" sẽ bị mất",
            type: 'warning', confirmText: 'Vẫn Lưu', cancelText: 'Hủy bỏ', onConfirm: () => processAndSaveQuizzes(null)
        });
    } else {
        processAndSaveQuizzes(null);
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
                
                const isLocalCreated = localCreatedQuizzes.find(item => item.code === currentQuizCode);
                
                if (isLocalCreated) {
                    let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
                    const idx = locals.findIndex(item => item.code === currentQuizCode);
                    if (idx >= 0) {
                        locals[idx].parsedData = newData;
                        localStorage.setItem('quiz_local_created', JSON.stringify(locals));
                        setLocalCreatedQuizzes(locals);
                        showMessage("Tải ảnh và lưu tạm thành công!", "success");
                    }
                } else if (currentUser && !currentUser.isGuest && db) {
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
        if (newType === 'sa' && newData.options.length === 0) newData.options = [{id: generateId(), text: '', isCorrect: true, image: null}];
        
        if (newType === 'tf') {
            if (newData.options.length === 0) newData.options = [
                {id: generateId(), text: 'Mệnh đề a', isCorrect: true, image: null},
                {id: generateId(), text: 'Mệnh đề b', isCorrect: false, image: null}
            ];
        }
        
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
        
        const isLocalCreated = localCreatedQuizzes.find(item => item.code === currentQuizCode);
        
        if (isLocalCreated) {
            let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
            const idx = locals.findIndex(item => item.code === currentQuizCode);
            if (idx >= 0) {
                locals[idx].parsedData = newData;
                localStorage.setItem('quiz_local_created', JSON.stringify(locals));
                setLocalCreatedQuizzes(locals);
                showMessage("Đã lưu tạm thành công!", "success");
            }
        } else if (currentUser && !currentUser.isGuest && currentQuizCode && db) {
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
                
                const isLocalCreated = localCreatedQuizzes.find(item => item.code === currentQuizCode);
                
                if (isLocalCreated) {
                    let locals = JSON.parse(localStorage.getItem('quiz_local_created') || '[]');
                    const idx = locals.findIndex(item => item.code === currentQuizCode);
                    if (idx >= 0) {
                        locals[idx].parsedData = newData;
                        localStorage.setItem('quiz_local_created', JSON.stringify(locals));
                        setLocalCreatedQuizzes(locals);
                        showMessage("Đã xóa!", "success");
                    }
                } else if (currentUser && !currentUser.isGuest && currentQuizCode && db) {
                try { await db.doc(`${quizzesPath}/${currentQuizCode}`).update({ parsedData: newData }); showMessage("Đã xóa!", "success"); } catch(e) {}
                }
            }
        });
    };

    const handleAddNewQuestion = (sectionId) => {
    let defaultOptions = [];
    if (sectionId === 'tf') {
        defaultOptions = [
            {id: generateId(), text: 'Mệnh đề a', isCorrect: true, image: null},
            {id: generateId(), text: 'Mệnh đề b', isCorrect: false, image: null},
            {id: generateId(), text: 'Mệnh đề c', isCorrect: false, image: null},
            {id: generateId(), text: 'Mệnh đề d', isCorrect: false, image: null}
        ];
    } else if (sectionId !== 'rc') {
        defaultOptions = [
            {id: generateId(), text: 'Đáp án A', isCorrect: true, image: null},
            {id: generateId(), text: 'Đáp án B', isCorrect: false, image: null},
            {id: generateId(), text: 'Đáp án C', isCorrect: false, image: null},
            {id: generateId(), text: 'Đáp án D', isCorrect: false, image: null}
        ];
    }

    const newQ = { 
        id: generateId(), 
        text: "Câu hỏi mới...", 
        type: sectionId, 
        options: defaultOptions, 
        subQuestions: sectionId === 'rc' ? [{id: generateId(), text: '#1. Câu hỏi phụ mới', options: [{id: generateId(), text: 'Đáp án 1', isCorrect: true, image: null}]}] : [], 
        image: null 
    };
    setEditingQ({ sectionId: sectionId, data: newQ, isNew: true });
    };

    const prepareQuiz = () => {
        clearQuizSession(); // Xóa session cũ trước khi bắt đầu bài mới
        let finalMc = [...parsedData.mc], finalTf = [...parsedData.tf], finalSa = [...parsedData.sa], finalRc = [...(parsedData.rc || [])];
        const shuffleOpts = config.shuffle === 'options' || config.shuffle === 'both';
        const shuffleQ = config.shuffle === 'questions' || config.shuffle === 'both';
        
        if (shuffleQ) { finalMc = shuffleArray(finalMc); finalTf = shuffleArray(finalTf); finalSa = shuffleArray(finalSa); finalRc = shuffleArray(finalRc); }
        if (shuffleOpts) {
        finalMc.forEach(q => { q.options = shuffleArray(q.options); }); finalTf.forEach(q => { q.options = shuffleArray(q.options); });
        finalRc.forEach(q => { q.subQuestions.forEach(sq => { sq.options = shuffleArray(sq.options); }) });
        }

        const selectedOrder = (config.selectedSections && config.selectedSections.length > 0) ? config.selectedSections : ['mc', 'tf', 'sa', 'rc'];
        const newFinalMc = [], newFinalTf = [], newFinalSa = [], newFinalRc = [];
        let flatArray = [];

        selectedOrder.forEach(type => {
            if (type === 'mc') { flatArray.push(...finalMc); newFinalMc.push(...finalMc); }
            if (type === 'tf') { flatArray.push(...finalTf); newFinalTf.push(...finalTf); }
            if (type === 'sa') { flatArray.push(...finalSa); newFinalSa.push(...finalSa); }
            if (type === 'rc') { flatArray.push(...finalRc); newFinalRc.push(...finalRc); }
        });

        setActiveQuiz({ mc: newFinalMc, tf: newFinalTf, sa: newFinalSa, rc: newFinalRc, flat: flatArray });
        setAnswers({}); setCurrentIndex(0); setIsSubmitted(false); setSingleQuestionConfirmed(false); setEndRemark(''); 
        let rcQCount = newFinalRc.reduce((acc, q) => acc + q.subQuestions.length, 0);
        setScore({ correct: 0, total: newFinalMc.length + newFinalTf.length + newFinalSa.length + rcQCount });
        
        saveToRecentHistory(currentQuizCode, quizTitle, parsedData, timeLimit);
        navigate(`Overview/${currentQuizCode || 'draft'}/Test`);
    };

    const prepareRedoIncorrectQuiz = useCallback(() => {
        clearQuizSession();
        if (!incorrectData) return;
        const finalMc = incorrectData.mc || [];
        const finalTf = incorrectData.tf || [];
        const finalSa = incorrectData.sa || [];
        const finalRc = incorrectData.rc || [];

        const flatArray = [];
        const selectedOrder = (config.selectedSections && config.selectedSections.length > 0) ? config.selectedSections : ['mc', 'tf', 'sa', 'rc'];

        selectedOrder.forEach(type => {
            if (type === 'mc') flatArray.push(...finalMc);
            if (type === 'tf') flatArray.push(...finalTf);
            if (type === 'sa') flatArray.push(...finalSa);
            if (type === 'rc') flatArray.push(...finalRc);
        });

        setActiveQuiz({ mc: finalMc, tf: finalTf, sa: finalSa, rc: finalRc, flat: flatArray });
        setAnswers({});
        setCurrentIndex(0);
        setIsSubmitted(false);
        setSingleQuestionConfirmed(false);
        setEndRemark('');

        let rcQCount = finalRc.reduce((acc, q) => acc + q.subQuestions.length, 0);
        setScore({ correct: 0, total: finalMc.length + finalTf.length + finalSa.length + rcQCount });

        navigate(`Overview/${currentQuizCode || 'draft'}/Test`);
    }, [incorrectData, config.selectedSections, currentQuizCode, navigate, clearQuizSession]);

    const checkQuestionCorrect = useCallback((type, qObj, userAns) => {
    if (type === 'mc' || type === 'rc') {
        const correctIds = qObj.options.filter(o => o.isCorrect).map(o => o.id);
        return Array.isArray(userAns) && userAns.length > 0 && correctIds.includes(userAns[0]);
    } else if (type === 'tf') {
        const ans = userAns || {};
        if (Array.isArray(ans)) {
            const correctIds = qObj.options.filter(o => o.isCorrect).map(o => o.id);
            return ans.length === correctIds.length && ans.every(id => correctIds.includes(id));
        }
        if (Object.keys(ans).length !== qObj.options.length) return false;
        return qObj.options.every(o => !!ans[o.id] === !!o.isCorrect);
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
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-lg font-bold text-white text-center animate-fade-in ${globalMessage.type === 'warning' ? 'bg-amber-500' : (globalMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600')}`}>
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

    let ActiveScreenComponent = null;

    if (isSetupNeeded) ActiveScreenComponent = <SetupScreen />;
    else if (isGlobalLoading || isFetchingQuiz) ActiveScreenComponent = <LoadingScreen />;
    else if (activeScreen === 'login') ActiveScreenComponent = <LoginScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} handleGuestJoin={handleGuestJoin} handleCodeInputChange={handleCodeInputChange} handleLogin={handleLogin} handleGuestLogin={handleGuestLogin} />;
    else if (activeScreen === 'dashboard') ActiveScreenComponent = <DashboardScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} currentUser={currentUser} setCurrentUser={setCurrentUser} navigate={navigate} resetQuiz={resetQuiz} myQuizzes={displayQuizzes} recentQuizzes={recentQuizzes} setRecentQuizzes={setRecentQuizzes} db={db} quizzesPath={quizzesPath} handleGuestJoin={handleGuestJoin} handleCodeInputChange={handleCodeInputChange} handleDeleteAccount={handleDeleteAccount} handleChangePassword={handleChangePassword} copyToClipboard={copyToClipboard} setCustomAlert={setCustomAlert} handleDeleteQuiz={handleDeleteQuiz} handleExtendQuiz={handleExtendQuiz} />;
    else if (activeScreen === 'input') ActiveScreenComponent = <InputScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} navigate={navigate} quizTitle={quizTitle} setQuizTitle={setQuizTitle} currentQuizCode={currentQuizCode} rawTexts={rawTexts} setRawTexts={setRawTexts} handleParseAndSave={handleParseAndSave} saveCooldown={saveCooldown} isSaving={isSaving} setShowGuestSaveModal={setShowGuestSaveModal} currentUser={currentUser} />;
    else if (activeScreen === 'overview') ActiveScreenComponent = <OverviewScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} quizTitle={quizTitle} timeLimit={timeLimit} setTimeLimit={setTimeLimit} currentQuizCode={currentQuizCode} copyToClipboard={copyToClipboard} config={config} setConfig={setConfig} prepareQuiz={prepareQuiz} isReadOnly={isReadOnly} navigate={navigate} cloneQuizAdmin={cloneQuizAdmin} cloneCooldown={cloneCooldown} currentUser={currentUser} parsedData={parsedData} />;
    else if (activeScreen === 'settings') ActiveScreenComponent = <SettingsScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} parsedData={parsedData} setParsedData={setParsedData} editingQ={editingQ} setEditingQ={setEditingQ} navigate={navigate} currentQuizCode={currentQuizCode} isReadOnly={isReadOnly} currentUser={currentUser} db={db} handleImageUpload={handleImageUpload} changeQuestionType={changeQuestionType} saveInlineEdit={saveInlineEdit} removeInlineQuestion={removeInlineQuestion} handleAddNewQuestion={handleAddNewQuestion} showMessage={showMessage} quizzesPath={quizzesPath} quizTitle={quizTitle} setShowGuestSaveModal={setShowGuestSaveModal} />;
    else if (activeScreen === 'quiz') ActiveScreenComponent = <QuizScreen ThemeToggleBtn={ThemeToggleBtn} Notification={Notification} CustomConfirmModal={CustomConfirmModal} activeQuiz={activeQuiz} answers={answers} setAnswers={setAnswers} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} isSubmitted={isSubmitted} setIsSubmitted={setIsSubmitted} singleQuestionConfirmed={singleQuestionConfirmed} setSingleQuestionConfirmed={setSingleQuestionConfirmed} score={score} setScore={setScore} endRemark={endRemark} setEndRemark={setEndRemark} navigate={navigate} currentQuizCode={currentQuizCode} currentUser={currentUser} config={config} checkQuestionCorrect={checkQuestionCorrect} generateRandomRemark={generateRandomRemark} showMessage={showMessage} timeLimit={timeLimit} setCustomAlert={setCustomAlert} setIncorrectData={setIncorrectData} clearQuizSession={clearQuizSession} />;
    else if (activeScreen === 'result') ActiveScreenComponent = <ResultScreen ThemeToggleBtn={ThemeToggleBtn} score={score} endRemark={endRemark} prepareQuiz={prepareQuiz} navigate={navigate} currentUser={currentUser} incorrectData={incorrectData} prepareRedoIncorrectQuiz={prepareRedoIncorrectQuiz} />;

    return (
    <>
        {ActiveScreenComponent}
        {showGuestSaveModal && (
            <div className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative animate-bounce-in border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setShowGuestSaveModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><Icons.UserX /></button>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Lưu vào Tài Khoản</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm font-medium">Đăng nhập để đồng bộ đề thi này lên máy chủ.</p>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const uname = e.target.username.value.replace(/\s+/g, '');
                        const pwd = e.target.password.value;
                        if (!uname || !pwd) return showMessage("Vui lòng nhập đủ thông tin.");
                        const userRef = db.doc(`${usersPath}/${uname.toLowerCase()}`);
                        try {
                            const userSnap = await userRef.get();
                            if (userSnap.exists) {
                                if (userSnap.data().password === pwd) {
                                    const loggedInUser = { username: userSnap.data().username, isVip: !!userSnap.data().isVip };
                                    setCurrentUser(loggedInUser);
                                    setShowGuestSaveModal(false);
                                    setTimeout(() => processAndSaveQuizzes(loggedInUser), 100);
                                } else showMessage("Sai mật khẩu!");
                            } else {
                                const newUser = { username: uname, password: pwd, isVip: false };
                                await userRef.set(newUser);
                                const loggedInUser = { username: uname, isVip: false };
                                setCurrentUser(loggedInUser);
                                setShowGuestSaveModal(false);
                                showMessage("Tạo tài khoản và lưu thành công!", "success");
                                setTimeout(() => processAndSaveQuizzes(loggedInUser), 100);
                            }
                        } catch (error) { showMessage("Lỗi kết nối máy chủ!"); }
                    }} className="space-y-4">
                        <input type="text" name="username" placeholder="Tên đăng nhập" maxLength={15} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium dark:text-white transition-colors" />
                        <input type="password" name="password" placeholder="Mật khẩu" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium dark:text-white transition-colors" />
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow">Đăng Nhập & Lưu</button>
                    </form>
                </div>
            </div>
        )}
    </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<window.MainApp />);