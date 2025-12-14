"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisResult, getHistory, deleteResult } from "../utils/storage";
import Navigation from "../components/Navigation";
import DetailModal from "../components/DetailModal";

function HistoryContent() {
    const searchParams = useSearchParams();
    const [history, setHistory] = useState<AnalysisResult[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<AnalysisResult | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    useEffect(() => {
        const data = getHistory();
        setHistory(data);

        // Deep linking check
        const idFromUrl = searchParams.get("id");
        if (idFromUrl) {
            const item = data.find(i => i.id === idFromUrl);
            if (item) setSelectedItem(item);
        }
    }, [searchParams]);

    const handleDelete = (id: string) => {
        if (confirm("この記録を削除してもよろしいですか？")) {
            deleteResult(id);
            setHistory(getHistory());
            if (selectedItem?.id === id) setSelectedItem(null);
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        if (confirm(`選択した ${selectedIds.size} 件の記録を削除してもよろしいですか？`)) {
            selectedIds.forEach(id => deleteResult(id));
            setHistory(getHistory());
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const filteredHistory = history.filter(item => {
        const query = searchQuery.toLowerCase();
        const dateStr = new Date(item.date).toLocaleDateString('ja-JP');
        return (
            item.input.toLowerCase().includes(query) ||
            dateStr.includes(query) ||
            item.result.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen pb-24">
            <Navigation />

            <main className="p-6 md:p-12 max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">食事履歴</h1>

                    <div className="flex gap-2 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-grow md:w-64">
                            <input
                                type="text"
                                placeholder="日付や食材で検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Bulk Action Button */}
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds(new Set());
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${isSelectionMode
                                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                }`}
                        >
                            {isSelectionMode ? "キャンセル" : "選択削除"}
                        </button>
                    </div>
                </div>

                {isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {selectedIds.size}件を削除
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center text-gray-400 py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                            {searchQuery ? "検索結果が見つかりません" : "まだ記録がありません"}
                        </div>
                    ) : (
                        filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    if (isSelectionMode) {
                                        toggleSelection(item.id);
                                    } else {
                                        setSelectedItem(item);
                                    }
                                }}
                                className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer flex items-center justify-between group ${isSelectionMode && selectedIds.has(item.id)
                                        ? "border-orange-500 ring-2 ring-orange-100 bg-orange-50"
                                        : "border-gray-50 hover:shadow-md hover:border-orange-100"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {isSelectionMode && (
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id)
                                                ? "border-orange-500 bg-orange-500 text-white"
                                                : "border-gray-300 bg-white"
                                            }`}>
                                            {selectedIds.has(item.id) && (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${item.mealType === "Breakfast" ? "bg-orange-50 text-orange-500" :
                                            item.mealType === "Lunch" ? "bg-yellow-50 text-yellow-600" :
                                                item.mealType === "Dinner" ? "bg-purple-50 text-purple-500" :
                                                    "bg-pink-50 text-pink-500"
                                        }`}>
                                        {item.mealType === "Breakfast" ? "朝" :
                                            item.mealType === "Lunch" ? "昼" :
                                                item.mealType === "Dinner" ? "夕" : "間"}
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-400 mb-0.5">
                                            {new Date(item.date).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <h3 className="font-bold text-gray-700 line-clamp-1">{item.input}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.risk === "High" ? "bg-red-50 text-red-500" :
                                            item.risk === "Medium" ? "bg-yellow-50 text-yellow-600" :
                                                "bg-blue-50 text-blue-500"
                                        }`}>
                                        {item.risk === "High" ? "高" : item.risk === "Medium" ? "中" : "低"}
                                    </span>
                                    {!isSelectionMode && (
                                        <svg className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            {selectedItem && (
                <DetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <HistoryContent />
        </Suspense>
    );
}
