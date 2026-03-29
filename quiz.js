const { useState, useEffect, useCallback } = React;

var CountdownTimer = React.memo(({ initialTime, isSubmitted, handleTimeUp, quizCode }) => {
    // Thêm chức năng lưu Timer vào LocalStorage
    const [timeLeft, setTimeLeft] = useState(() => {
        if (!quizCode) return initialTime;
        const saved = localStorage.getItem(`quiz_timer_${quizCode}`);
        return saved !== null ? parseInt(saved, 10) : initialTime;
    });

    useEffect(() => {
        if (initialTime <= 0 || isSubmitted) {
            if (isSubmitted && quizCode) localStorage.removeItem(`quiz_timer_${quizCode}`);
            return;
        }
        if (timeLeft <= 0) {
            handleTimeUp();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                if (quizCode) localStorage.setItem(`quiz_timer_${quizCode}`, newTime);
                return newTime;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isSubmitted, initialTime, handleTimeUp, quizCode]);

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

var QuizScreen = React.memo(({ ThemeToggleBtn, Notification, CustomConfirmModal, activeQuiz, answers, setAnswers, currentIndex, setCurrentIndex, isSubmitted, setIsSubmitted, singleQuestionConfirmed, setSingleQuestionConfirmed, score, setScore, endRemark, setEndRemark, navigate, currentQuizCode, currentUser, config, checkQuestionCorrect, generateRandomRemark, showMessage, timeLimit, setCustomAlert, setIncorrectData, clearQuizSession }) => {
    const isModeSingle = config.mode === 'single';
    const totalQ = score.total;
    const mcLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    const initialTime = parseInt(timeLimit) || 0;

    const evaluateIncorrect = useCallback(() => {
        let data = { mc: [], tf: [], sa: [], rc: [] };
        activeQuiz.mc.forEach(q => { if (!checkQuestionCorrect('mc', q, answers[q.id])) data.mc.push(q); });
        activeQuiz.tf.forEach(q => { if (!checkQuestionCorrect('tf', q, answers[q.id])) data.tf.push(q); });
        activeQuiz.sa.forEach(q => { if (!checkQuestionCorrect('sa', q, answers[q.id])) data.sa.push(q); });
        activeQuiz.rc.forEach(q => {
            const failedSubQs = q.subQuestions.filter(sq => !checkQuestionCorrect('rc', sq, answers[sq.id]));
            if (failedSubQs.length > 0) {
                data.rc.push({ ...q, subQuestions: failedSubQs });
            }
        });
        setIncorrectData(data);
    }, [activeQuiz, answers, checkQuestionCorrect, setIncorrectData]);

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
        evaluateIncorrect();
        setEndRemark(generateRandomRemark(correct, totalQ));
        setIsSubmitted(true);
        setSingleQuestionConfirmed(true);
        if (clearQuizSession) clearQuizSession();
        if (isModeSingle) {
            navigate(`Overview/${currentQuizCode || 'draft'}/Result`);
        } else {
            window.scrollTo(0,0);
        }
    }, [activeQuiz, answers, totalQ, isModeSingle, navigate, currentQuizCode, checkQuestionCorrect, generateRandomRemark, showMessage, setScore, setEndRemark, setIsSubmitted, setSingleQuestionConfirmed, evaluateIncorrect, clearQuizSession]);

    const getOptClass = (opt, isSelected, showResult) => {
    if (!showResult) return isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200';
    if (opt.isCorrect && isSelected) return 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300 shadow-sm';
    if (opt.isCorrect && !isSelected) return 'bg-white dark:bg-slate-800 border-green-500 border-dashed text-green-700 dark:text-green-400';
    if (!opt.isCorrect && isSelected) return 'bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-300 shadow-sm';
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

        if (type === 'tf') {
            return (
                <div className="grid gap-3 min-w-0">
                {qObj.options.map((opt, oIdx) => {
                    const ansObj = answers[qObj.id] || {};
                    const selectedVal = ansObj[opt.id]; 
                    
                    const getBtnClass = (btnType) => {
                        if (!isConfirming) return selectedVal === btnType ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500';
                        if (opt.isCorrect === btnType) return 'bg-green-500 border-green-500 text-white shadow-md';
                        if (selectedVal === btnType && selectedVal !== opt.isCorrect) return 'bg-red-500 border-red-500 text-white shadow-md';
                        return 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-50 text-slate-400';
                    };

                    return (
                    <div key={opt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 min-w-0 transition-colors">
                        <div className="flex-1 font-medium text-lg whitespace-pre-wrap break-words min-w-0">
                            <span className="font-bold mr-2 text-indigo-600 dark:text-indigo-400">{String.fromCharCode(97+oIdx)})</span>
                            {opt.text}
                            {opt.image && <img src={opt.image} className="mt-3 max-h-40 rounded-lg object-contain shadow-sm border border-slate-200 dark:border-slate-700" />}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => !isConfirming && setAnswers({...answers, [qObj.id]: {...ansObj, [opt.id]: true}})} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold transition-all border-2 ${getBtnClass(true)}`}>Đúng</button>
                            <button onClick={() => !isConfirming && setAnswers({...answers, [qObj.id]: {...ansObj, [opt.id]: false}})} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold transition-all border-2 ${getBtnClass(false)}`}>Sai</button>
                        </div>
                    </div>
                    )
                })}
                </div>
            );
        }

        return (
        <div className="grid gap-3 min-w-0">
            {qObj.options.map((opt, oIdx) => {
            const isSelected = (answers[qObj.id] || []).includes(opt.id);
            
            let circleClass = 'border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30';
            if (!isConfirming) {
                if (isSelected) circleClass = 'bg-blue-600 border-blue-600 text-white';
            } else {
                if (opt.isCorrect) circleClass = 'bg-green-500 border-green-500 text-white';
                else if (isSelected) circleClass = 'bg-red-500 border-red-500 text-white';
                else circleClass = 'border-slate-300 dark:border-slate-600 text-slate-400 opacity-50';
            }

            return (
                <label key={opt.id} className={`flex items-start p-4 border-2 rounded-xl transition cursor-pointer min-w-0 group ${getOptClass(opt, isSelected, isConfirming)}`} 
                onClick={() => {
                    if (isConfirming) return;
                    setAnswers({...answers, [qObj.id]: [opt.id]});
                }}>
                <input type="radio" className="hidden" checked={isSelected} readOnly />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5 transition-colors border-2 shadow-sm ${circleClass}`}>
                    {mcLetters[oIdx]}
                </div>
                <div className="ml-3 font-medium text-lg whitespace-pre-wrap break-words min-w-0 pt-0.5 flex-1">
                    {opt.text}
                    {opt.image && <img src={opt.image} className="mt-3 max-h-40 rounded-lg object-contain shadow-sm border border-slate-200 dark:border-slate-700" />}
                </div>
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
        for (let sq of q.subQuestions) if (!answers[sq.id] || answers[sq.id].length === 0) return showMessage('Vui lòng làm hết các câu phụ!');
        q.subQuestions.forEach(sq => { if(checkQuestionCorrect('rc', sq, answers[sq.id])) isCorrectThisTime++; });
        setScore(p => ({ ...p, correct: p.correct + isCorrectThisTime }));
    } else if (q.type === 'tf') {
        const ansObj = answers[q.id] || {};
        if (Object.keys(ansObj).length !== q.options.length) return showMessage('Vui lòng chọn Đúng/Sai cho tất cả các mệnh đề!');
        if (checkQuestionCorrect('tf', q, ansObj)) { isCorrectThisTime = 1; setScore(p => ({ ...p, correct: p.correct + 1 })); }
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
        if(q.type === 'rc') { 
            q.subQuestions.forEach(sq => { if(!answers[sq.id] || answers[sq.id].length===0) hasUnanswered = true; }) 
        } else if (q.type === 'tf') {
            const ansObj = answers[q.id] || {};
            if (Object.keys(ansObj).length !== q.options.length) hasUnanswered = true;
        } else { 
            const ans = answers[q.id]; 
            if(!ans || (Array.isArray(ans)&&ans.length===0) || (typeof ans==='string'&&!ans.trim())) hasUnanswered = true; 
        }
    });
    if (hasUnanswered) return showMessage('Bạn còn câu chưa làm!');
    let correct = 0;
    activeQuiz.flat.forEach(q => {
        if(q.type === 'rc') { q.subQuestions.forEach(sq => { if(checkQuestionCorrect('rc', sq, answers[sq.id])) correct++; }) }
        else { if(checkQuestionCorrect(q.type, q, answers[q.id])) correct++; }
    });
    setScore({ correct, total: totalQ });
    evaluateIncorrect();
    setEndRemark(generateRandomRemark(correct, totalQ));
    setIsSubmitted(true);
    if (clearQuizSession) clearQuizSession();
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
        if (q.type === 'rc') { 
            q.subQuestions.forEach(sq => { if (answers[sq.id] && answers[sq.id].length > 0) count++; }); 
        } else if (q.type === 'tf') {
            const ansObj = answers[q.id] || {};
            if (Object.keys(ansObj).length === q.options.length) count++;
        } else { 
            const ans = answers[q.id]; 
            if (ans && ((Array.isArray(ans) && ans.length > 0) || (typeof ans === 'string' && ans.trim()))) count++; 
        }
        });
        answeredCount = count;
    }
    const progressPercent = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;
    const displayOrder = (config.selectedSections && config.selectedSections.length > 0) ? config.selectedSections : ['mc', 'tf', 'sa', 'rc'];

    return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20 animate-fade-in transition-colors">
        <Notification />
        <CustomConfirmModal />
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4 min-w-0 gap-2">
            <div className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors text-sm md:text-base whitespace-nowrap truncate min-w-0">Tiến độ: <span className="text-blue-600 dark:text-blue-400">{answeredCount}</span> / {totalQ}</div>
            
            <CountdownTimer initialTime={initialTime} isSubmitted={isSubmitted} handleTimeUp={handleTimeUp} quizCode={currentQuizCode} />

            <div className="flex items-center gap-3 shrink-0">
            <ThemeToggleBtn />
            <button onClick={() => { setCustomAlert({ isOpen: true, title: "CẢNH BÁO", message: "Thoát sẽ mất kết quả và xóa trạng thái đang làm dở?", type: 'warning', confirmText: 'Vẫn thoát', cancelText: 'Hủy', onConfirm: () => { if(clearQuizSession) clearQuizSession(); navigate(`Overview/${currentQuizCode || ''}`); } }); }} className="font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:text-red-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">Thoát</button>
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
                    <button onClick={() => {
                        if (currentIndex < activeQuiz.flat.length - 1) {
                            setCurrentIndex(p=>p+1);
                            setSingleQuestionConfirmed(false);
                        } else {
                            evaluateIncorrect();
                            navigate(`Overview/${currentQuizCode || 'draft'}/Result`);
                        }
                    }} className="bg-green-600 hover:bg-green-700 text-white font-black py-3.5 px-8 rounded-xl shadow-lg w-full md:w-auto flex items-center justify-center gap-2 transition truncate min-w-0">
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
            {displayOrder.map(type => {
                const data = activeQuiz[type]; if(!data || data.length === 0) return null;
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