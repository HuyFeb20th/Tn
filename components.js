const { useRef, useLayoutEffect } = React;

var AutoResizingTextarea = ({ value, onChange, className, rows }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, [value]);
    return (
        <textarea 
            ref={ref} 
            value={value} 
            onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                onChange(e.target.value);
            }} 
            className={className} 
            rows={rows} 
        />
    );
};

var SetupScreen = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 font-sans">
            <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
            <h1 className="text-3xl font-black text-red-600 mb-4">Chưa có kết nối Database!</h1>
            <p className="text-slate-600 mb-4">Hãy kiểm tra lại cấu hình Firebase trong code nhé.</p>
            </div>
        </div>
    );
}

var LoadingScreen = () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-[9999] transition-colors duration-300">
        <div className="relative w-16 h-16 mb-8">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase animate-pulse text-sm">Đang tải dữ liệu...</p>
    </div>
);

var ShortAnswerInput = ({ value = '', onChange, readOnly, isCorrect, showResult }) => {
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