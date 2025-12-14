"use client";

import { AnalysisResult } from "../utils/storage";

type DetailModalProps = {
    item: AnalysisResult;
    onClose: () => void;
    onDelete: (id: string) => void;
};

export default function DetailModal({ item, onClose, onDelete }: DetailModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.mealType === "Breakfast" ? "bg-orange-100 text-orange-600" :
                                item.mealType === "Lunch" ? "bg-yellow-100 text-yellow-600" :
                                    item.mealType === "Dinner" ? "bg-purple-100 text-purple-600" :
                                        "bg-pink-100 text-pink-600"
                            }`}>
                            {item.mealType === "Breakfast" ? "朝食" :
                                item.mealType === "Lunch" ? "昼食" :
                                    item.mealType === "Dinner" ? "夕食" : "間食"}
                        </span>
                        <span className="text-sm text-gray-400">
                            {new Date(item.date).toLocaleString('ja-JP')}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.input}</h2>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${item.risk === "High" ? "bg-red-100 text-red-500" :
                                item.risk === "Medium" ? "bg-yellow-100 text-yellow-600" :
                                    "bg-blue-100 text-blue-500"
                            }`}>
                            総合リスク: {item.risk === "High" ? "高" : item.risk === "Medium" ? "中" : "低"}
                        </span>
                    </div>
                </div>

                {/* Impact Analysis */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`p-3 rounded-xl border ${item.cholesterol_impact?.level === "High" ? "bg-red-50 border-red-100" :
                            item.cholesterol_impact?.level === "Medium" ? "bg-yellow-50 border-yellow-100" :
                                "bg-gray-50 border-gray-100"
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-500">コレステロール</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.cholesterol_impact?.level === "High" ? "bg-red-100 text-red-500" :
                                    item.cholesterol_impact?.level === "Medium" ? "bg-yellow-100 text-yellow-600" :
                                        "bg-blue-100 text-blue-500"
                                }`}>
                                {item.cholesterol_impact?.level || "不明"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {item.cholesterol_impact?.reason || "特になし"}
                        </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${item.neutral_fat_impact?.level === "High" ? "bg-red-50 border-red-100" :
                            item.neutral_fat_impact?.level === "Medium" ? "bg-yellow-50 border-yellow-100" :
                                "bg-gray-50 border-gray-100"
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-500">中性脂肪</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.neutral_fat_impact?.level === "High" ? "bg-red-100 text-red-500" :
                                    item.neutral_fat_impact?.level === "Medium" ? "bg-yellow-100 text-yellow-600" :
                                        "bg-blue-100 text-blue-500"
                                }`}>
                                {item.neutral_fat_impact?.level || "不明"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {item.neutral_fat_impact?.reason || "特になし"}
                        </p>
                    </div>
                </div>

                {/* Nutrition Grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                        <span className="block text-[10px] text-gray-400 font-bold mb-0.5">カロリー</span>
                        <span className="text-sm font-bold text-gray-700">{item.calories || "-"} <span className="text-[10px] font-normal">kcal</span></span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                        <span className="block text-[10px] text-gray-400 font-bold mb-0.5">脂質</span>
                        <span className="text-sm font-bold text-gray-700">{item.fat || "-"} <span className="text-[10px] font-normal">g</span></span>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-xl text-center border border-orange-100">
                        <span className="block text-[10px] text-orange-400 font-bold mb-0.5">飽和脂肪酸</span>
                        <span className="text-sm font-bold text-orange-600">{item.saturated_fat || "-"} <span className="text-[10px] font-normal">g</span></span>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.result}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        この記録を削除
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-700 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
