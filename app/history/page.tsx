"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisResult, getHistory, deleteResult } from "../utils/storage";
import Navigation from "../components/Navigation";
import DetailModal from "../components/DetailModal";

function HistoryContent() {
    const searchParams = useSearchParams();
    const [history, setHistory] = useState<AnalysisResult[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

    // Group by date
    const groupedByDate = history.reduce((acc, item) => {
        const dateKey = new Date(item.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {} as Record<string, AnalysisResult[]>);

    const dates = Object.keys(groupedByDate).sort((a, b) =>
        new Date(groupedByDate[b][0].date).getTime() - new Date(groupedByDate[a][0].date).getTime()
    );

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

    const displayItems = selectedDate && groupedByDate[selectedDate] ? groupedByDate[selectedDate] : [];

    return (
        <div className="min-h-screen pb-24">
            <Navigation />

            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">食事履歴</h1>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedIds(new Set());
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelectionMode
                            ? "bg-gray-200 text-gray-700"
                            : "bg-orange-50 text-orange-600"
                            }`}
                    >
                        {isSelectionMode ? "キャンセル" : "選択削除"}
                    </button>
                </div>

                {isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                        >
                            {selectedIds.size}件を削除
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date List */}
                    <div className="bg-white rounded-2xl p-3 shadow-soft border border-gray-50 h-fit">
                        <h2 className="text-sm font-bold text-gray-500 mb-2 px-2">日付で選択</h2>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {dates.length === 0 ? (
                                <p className="text-gray-400 text-sm p-2">記録がありません</p>
                            ) : (
                                dates.map(date => (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date === selectedDate ? null : date)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${date === selectedDate
                                                ? "bg-orange-100 text-orange-700 font-bold"
                                                : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{date}</span>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {groupedByDate[date].length}件
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="md:col-span-2 space-y-2">
                        {!selectedDate ? (
                            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
                                ← 日付を選択してください
                            </div>
                        ) : displayItems.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                                記録がありません
                            </div>
                        ) : (
                            displayItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => isSelectionMode ? toggleSelection(item.id) : setSelectedItem(item)}
                                    className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${isSelectionMode && selectedIds.has(item.id)
                                            ? "border-orange-500 bg-orange-50"
                                            : "border-gray-100 hover:border-orange-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isSelectionMode && (
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(item.id) ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300"
                                                }`}>
                                                {selectedIds.has(item.id) && (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}

                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${item.mealType === "Breakfast" ? "bg-orange-50 text-orange-500" :
                                                item.mealType === "Lunch" ? "bg-yellow-50 text-yellow-600" :
                                                    item.mealType === "Dinner" ? "bg-purple-50 text-purple-500" :
                                                        "bg-pink-50 text-pink-500"
                                            }`}>
                                            {item.mealType === "Breakfast" ? "朝" :
                                                item.mealType === "Lunch" ? "昼" :
                                                    item.mealType === "Dinner" ? "夕" : "間"}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-700 text-sm truncate">{item.input}</h3>
                                            <div className="flex gap-2 mt-1 text-xs text-gray-500">
                                                <span>{item.calories || 0}kcal</span>
                                                <span>P:{item.protein || 0}g</span>
                                                <span>F:{item.fat || 0}g</span>
                                                <span>C:{item.carbohydrates || 0}g</span>
                                            </div>
                                        </div>

                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.risk === "High" ? "bg-red-50 text-red-500" :
                                                item.risk === "Medium" ? "bg-yellow-50 text-yellow-600" :
                                                    "bg-blue-50 text-blue-500"
                                            }`}>
                                            {item.risk === "High" ? "高" : item.risk === "Medium" ? "中" : "低"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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
