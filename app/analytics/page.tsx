"use client";

import { useState, useEffect } from "react";
import { getHistory, AnalysisResult } from "../utils/storage";
import { getUserProfile, UserProfile } from "../settings/page";
import Navigation from "../components/Navigation";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// PFC適正範囲（日本人の食事摂取基準より）
const PFC_RANGES = {
    protein: { min: 13, max: 20, label: "タンパク質(P)" },
    fat: { min: 20, max: 30, label: "脂質(F)" },
    carbs: { min: 50, max: 65, label: "炭水化物(C)" }
};

export default function AnalyticsPage() {
    const [history, setHistory] = useState<AnalysisResult[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        setHistory(getHistory());
        setUserProfile(getUserProfile());
    }, []);

    // 過去7日間のデータ
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d;
    });

    // 日別カロリー
    const dailyCalories = last7Days.map(day => {
        const dayRecords = history.filter(h =>
            new Date(h.date).toDateString() === day.toDateString()
        );
        return dayRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    });

    // 週間合計
    const weekRecords = history.filter(h => {
        const recordDate = new Date(h.date);
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return recordDate >= weekAgo;
    });

    const totalCalories = weekRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    const totalFat = weekRecords.reduce((sum, r) => sum + (r.fat || 0), 0);
    const totalProtein = weekRecords.reduce((sum, r) => sum + (r.protein || 0), 0);
    const totalCarbs = weekRecords.reduce((sum, r) => sum + (r.carbohydrates || 0), 0);

    // PFC比率計算
    const totalMacroCalories = totalFat * 9 + totalProtein * 4 + totalCarbs * 4;
    const fatRatio = totalMacroCalories > 0 ? (totalFat * 9 / totalMacroCalories) * 100 : 0;
    const proteinRatio = totalMacroCalories > 0 ? (totalProtein * 4 / totalMacroCalories) * 100 : 0;
    const carbRatio = totalMacroCalories > 0 ? (totalCarbs * 4 / totalMacroCalories) * 100 : 0;

    // カロリー目標
    const targetCalories = userProfile?.targetCalories || 2000;
    const weeklyTarget = targetCalories * 7;
    const caloriePercentage = weeklyTarget > 0 ? (totalCalories / weeklyTarget) * 100 : 0;

    // 評価関数
    const getRatioStatus = (value: number, min: number, max: number) => {
        if (value < min) return { status: "low", color: "text-blue-500", bg: "bg-blue-50" };
        if (value > max) return { status: "high", color: "text-orange-500", bg: "bg-orange-50" };
        return { status: "ok", color: "text-green-500", bg: "bg-green-50" };
    };

    // PFCチャートデータ
    const pfcData = {
        labels: ['脂質', 'タンパク質', '炭水化物'],
        datasets: [{
            data: [fatRatio, proteinRatio, carbRatio],
            backgroundColor: ['rgba(251, 146, 60, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(59, 130, 246, 0.8)'],
            borderWidth: 0
        }]
    };

    // 週間カロリーチャート
    const weeklyChartData = {
        labels: last7Days.map(d => `${d.getMonth() + 1}/${d.getDate()}`),
        datasets: [{
            label: '摂取カロリー',
            data: dailyCalories,
            backgroundColor: dailyCalories.map(cal =>
                cal === 0 ? 'rgba(200, 200, 200, 0.5)' :
                    cal > targetCalories * 1.2 ? 'rgba(239, 68, 68, 0.7)' :
                        cal < targetCalories * 0.7 ? 'rgba(59, 130, 246, 0.7)' :
                            'rgba(34, 197, 94, 0.7)'
            ),
            borderRadius: 6
        }]
    };

    return (
        <div className="min-h-screen pb-24">
            <Navigation />

            <main className="p-4 md:p-6 max-w-3xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 mb-4">週間レポート</h1>

                {/* PFCバランス */}
                <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-50 mb-4">
                    <h2 className="text-sm font-bold text-gray-700 mb-3">PFCバランス（過去7日間）</h2>

                    {totalCalories === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">データがありません</p>
                    ) : (
                        <div className="flex gap-4 items-center">
                            <div className="w-28 h-28 flex-shrink-0">
                                <Doughnut
                                    data={pfcData}
                                    options={{
                                        plugins: { legend: { display: false } },
                                        cutout: '60%'
                                    }}
                                />
                            </div>
                            <div className="flex-1 space-y-2 text-sm">
                                {/* タンパク質 */}
                                <div className={`p-2 rounded-lg ${getRatioStatus(proteinRatio, PFC_RANGES.protein.min, PFC_RANGES.protein.max).bg}`}>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">P（タンパク質）</span>
                                        <span className={`font-bold ${getRatioStatus(proteinRatio, PFC_RANGES.protein.min, PFC_RANGES.protein.max).color}`}>
                                            {proteinRatio.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">適正: {PFC_RANGES.protein.min}-{PFC_RANGES.protein.max}%</div>
                                </div>
                                {/* 脂質 */}
                                <div className={`p-2 rounded-lg ${getRatioStatus(fatRatio, PFC_RANGES.fat.min, PFC_RANGES.fat.max).bg}`}>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">F（脂質）</span>
                                        <span className={`font-bold ${getRatioStatus(fatRatio, PFC_RANGES.fat.min, PFC_RANGES.fat.max).color}`}>
                                            {fatRatio.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">適正: {PFC_RANGES.fat.min}-{PFC_RANGES.fat.max}%</div>
                                </div>
                                {/* 炭水化物 */}
                                <div className={`p-2 rounded-lg ${getRatioStatus(carbRatio, PFC_RANGES.carbs.min, PFC_RANGES.carbs.max).bg}`}>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">C（炭水化物）</span>
                                        <span className={`font-bold ${getRatioStatus(carbRatio, PFC_RANGES.carbs.min, PFC_RANGES.carbs.max).color}`}>
                                            {carbRatio.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">適正: {PFC_RANGES.carbs.min}-{PFC_RANGES.carbs.max}%</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* カロリー推移 */}
                <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-50 mb-4">
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-sm font-bold text-gray-700">カロリー推移</h2>
                        {userProfile && (
                            <span className="text-xs text-gray-400">目標: {targetCalories}kcal/日</span>
                        )}
                    </div>

                    <div className="h-32">
                        <Bar
                            data={weeklyChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
                                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>

                    {/* 凡例 */}
                    <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>適正（目標±20%）
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>オーバー（+20%以上）
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>不足（-30%以下）
                        </span>
                    </div>
                </div>

                {/* 週間サマリー */}
                <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-50">
                    <h2 className="text-sm font-bold text-gray-700 mb-3">今週のまとめ</h2>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <div className="text-xs text-gray-500">総カロリー</div>
                            <div className="text-lg font-bold text-gray-800">{totalCalories.toLocaleString()}<span className="text-xs font-normal">kcal</span></div>
                        </div>
                        <div className={`p-3 rounded-xl ${caloriePercentage > 110 ? 'bg-red-50' : caloriePercentage < 80 ? 'bg-blue-50' : 'bg-green-50'}`}>
                            <div className="text-xs text-gray-500">目標比</div>
                            <div className={`text-lg font-bold ${caloriePercentage > 110 ? 'text-red-500' : caloriePercentage < 80 ? 'text-blue-500' : 'text-green-500'}`}>
                                {caloriePercentage.toFixed(0)}%
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <div className="text-xs text-gray-500">記録数</div>
                            <div className="text-lg font-bold text-gray-800">{weekRecords.length}<span className="text-xs font-normal">件</span></div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <div className="text-xs text-gray-500">1日平均</div>
                            <div className="text-lg font-bold text-gray-800">{Math.round(totalCalories / 7).toLocaleString()}<span className="text-xs font-normal">kcal</span></div>
                        </div>
                    </div>

                    {!userProfile && (
                        <div className="mt-3 bg-blue-50 p-3 rounded-xl text-center">
                            <a href="/settings" className="text-blue-600 text-sm">設定でカロリー目標を設定 →</a>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
