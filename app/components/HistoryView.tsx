"use client";

import { useEffect, useState } from "react";
import { AnalysisResult, getHistory, clearHistory } from "../utils/storage";

export default function HistoryView({ refreshTrigger }: { refreshTrigger: number }) {
    const [history, setHistory] = useState<AnalysisResult[]>([]);

    useEffect(() => {
        setHistory(getHistory());
    }, [refreshTrigger]);

    if (history.length === 0) {
        return (
            <div className="text-center text-gray-400 py-8">
                <p>まだ記録がありません。</p>
                <p className="text-sm mt-2">食べたものを入力して分析してみましょう！</p>
            </div>
        );
    }

    // Simple stats
    const highRiskCount = history.filter((h) => h.risk === "High").length;
    const mediumRiskCount = history.filter((h) => h.risk === "Medium").length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <h3 className="text-lg font-semibold text-white mb-2">📊 今週の傾向</h3>
                <div className="flex gap-4 text-sm">
                    <div className="flex-1 bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                        <span className="block text-red-200">高リスク</span>
                        <span className="text-2xl font-bold text-red-400">{highRiskCount}</span>
                        <span className="text-xs text-red-300 ml-1">回</span>
                    </div>
                    <div className="flex-1 bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30">
                        <span className="block text-yellow-200">中リスク</span>
                        <span className="text-2xl font-bold text-yellow-400">{mediumRiskCount}</span>
                        <span className="text-xs text-yellow-300 ml-1">回</span>
                    </div>
                    <div className="flex-1 bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
                        <span className="block text-blue-200">記録数</span>
                        <span className="text-2xl font-bold text-blue-400">{history.length}</span>
                        <span className="text-xs text-blue-300 ml-1">回</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">🕒 最近の記録</h3>
                    <button
                        onClick={() => {
                            if (confirm("履歴をすべて削除しますか？")) {
                                clearHistory();
                                setHistory([]);
                            }
                        }}
                        className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                    >
                        履歴を削除
                    </button>
                </div>

                {history.map((item) => (
                    <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-400">
                                {new Date(item.date).toLocaleString("ja-JP")}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full border ${item.risk === "High" ? "bg-red-500/20 border-red-500/50 text-red-300" :
                                    item.risk === "Medium" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" :
                                        item.risk === "Low" ? "bg-green-500/20 border-green-500/50 text-green-300" :
                                            "bg-gray-500/20 border-gray-500/50 text-gray-300"
                                }`}>
                                {item.risk === "High" ? "高リスク" :
                                    item.risk === "Medium" ? "中リスク" :
                                        item.risk === "Low" ? "低リスク" : "判定不能"}
                            </span>
                        </div>
                        <p className="text-white font-medium mb-2">{item.input}</p>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap bg-black/20 p-3 rounded-lg">
                            {item.result}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
