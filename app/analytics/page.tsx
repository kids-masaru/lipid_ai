"use client";

import { useState, useEffect } from "react";
import { getHistory, AnalysisResult, deleteResult } from "../utils/storage";
import { getUserProfile, UserProfile } from "../settings/page";
import Navigation from "../components/Navigation";
import DetailModal from "../components/DetailModal";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement
);

export default function AnalyticsPage() {
    const [history, setHistory] = useState<AnalysisResult[]>([]);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [modalItem, setModalItem] = useState<AnalysisResult | null>(null);
    const [riskFilter, setRiskFilter] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        setHistory(getHistory());
        setUserProfile(getUserProfile());
    }, []);

    const handleDelete = (id: string) => {
        if (confirm("この記録を削除してもよろしいですか？")) {
            deleteResult(id);
            setHistory(getHistory());
            if (modalItem?.id === id) setModalItem(null);
        }
    };

    // Calendar Logic
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handleDayClick = (day: number) => {
        const clickedDate = new Date(currentYear, currentMonth, day);
        const dateStr = clickedDate.toDateString();

        setSelectedDates(prev => {
            const exists = prev.some(d => d.toDateString() === dateStr);
            if (exists) {
                return prev.filter(d => d.toDateString() !== dateStr);
            } else {
                return [...prev, clickedDate];
            }
        });
        setRiskFilter(null); // Reset filter when selection changes
    };

    // Data Aggregation
    const targetRecords = selectedDates.length > 0
        ? history.filter(h => selectedDates.some(d => new Date(h.date).toDateString() === d.toDateString()))
        : history.filter(h => {
            const d = new Date(h.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

    // Filtered Records for List
    const displayedRecords = riskFilter
        ? targetRecords.filter(r => r.risk === riskFilter)
        : targetRecords;

    // Sort by date desc
    displayedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Statistics
    const totalCalories = targetRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    const totalFat = targetRecords.reduce((sum, r) => sum + (r.fat || 0), 0);
    const totalProtein = targetRecords.reduce((sum, r) => sum + (r.protein || 0), 0);
    const totalCarbs = targetRecords.reduce((sum, r) => sum + (r.carbohydrates || 0), 0);

    const totalFatCalories = totalFat * 9;
    const totalProteinCalories = totalProtein * 4;
    const totalCarbCalories = totalCarbs * 4;

    // PFC Balance Calculation
    const fatRatio = totalCalories > 0 ? (totalFatCalories / totalCalories) * 100 : 0;
    const proteinRatio = totalCalories > 0 ? (totalProteinCalories / totalCalories) * 100 : 0;
    const carbRatio = totalCalories > 0 ? (totalCarbCalories / totalCalories) * 100 : 0;

    // Improved thresholds based on Japanese Dietary Guidelines
    // Ideal ranges: Fat 20-30%, Protein 13-20%, Carbs 50-65%
    let adviceMessage = "";
    let adviceColor = "text-gray-600";
    let hasWarning = false;
    let hasMild = false;

    if (totalCalories === 0) {
        adviceMessage = "データがありません";
    } else {
        const issues: string[] = [];

        // Fat check - more lenient thresholds
        if (fatRatio > 40) {
            issues.push("脂質がかなり多めです");
            hasWarning = true;
        } else if (fatRatio > 35) {
            issues.push("脂質がやや多めです");
            hasMild = true;
        }

        // Protein check - only warn if very low
        if (proteinRatio < 10) {
            issues.push("タンパク質が不足気味です");
            hasMild = true;
        }

        // Carbs check - only extreme values
        if (carbRatio > 70) {
            issues.push("炭水化物がやや多めです");
            hasMild = true;
        } else if (carbRatio < 40 && proteinRatio < 20) {
            issues.push("炭水化物が少なめです");
            hasMild = true;
        }

        // Generate message based on issues
        if (issues.length === 0) {
            adviceMessage = "素晴らしいバランスです！この調子で続けましょう 🎉";
            adviceColor = "text-green-600";
        } else if (hasWarning) {
            adviceMessage = issues.join("、") + "。少し意識してみましょう。";
            adviceColor = "text-orange-600";
        } else if (hasMild) {
            adviceMessage = issues.join("、") + "。でも大きな問題ではありません 👍";
            adviceColor = "text-yellow-600";
        }
    }

    const riskCounts = {
        High: targetRecords.filter(r => r.risk === "High").length,
        Medium: targetRecords.filter(r => r.risk === "Medium").length,
        Low: targetRecords.filter(r => r.risk === "Low").length
    };

    // Chart Data
    const doughnutData = {
        labels: ['脂質', 'タンパク質', '炭水化物'],
        datasets: [
            {
                data: [totalFatCalories, totalProteinCalories, totalCarbCalories],
                backgroundColor: [
                    'rgba(255, 159, 67, 0.8)', // Orange for Fat
                    'rgba(255, 99, 132, 0.8)', // Red/Pink for Protein
                    'rgba(54, 162, 235, 0.8)', // Blue for Carbs
                ],
                borderColor: [
                    'rgba(255, 159, 67, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Weekly calorie tracking
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d;
    });

    const dailyCalories = last7Days.map(day => {
        const dayRecords = history.filter(h =>
            new Date(h.date).toDateString() === day.toDateString()
        );
        return dayRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    });

    const weeklyChartData = {
        labels: last7Days.map(d => `${d.getMonth() + 1}/${d.getDate()}`),
        datasets: [
            {
                label: '摂取カロリー',
                data: dailyCalories,
                backgroundColor: dailyCalories.map(cal =>
                    userProfile && cal > userProfile.targetCalories * 1.2
                        ? 'rgba(239, 68, 68, 0.7)'
                        : userProfile && cal < userProfile.targetCalories * 0.7
                            ? 'rgba(59, 130, 246, 0.7)'
                            : 'rgba(34, 197, 94, 0.7)'
                ),
                borderRadius: 8,
            }
        ]
    };

    // Calorie goal comparison for selected period
    const targetCalories = userProfile?.targetCalories || 2000;
    const selectedDaysCount = selectedDates.length > 0 ? selectedDates.length :
        (new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear
            ? new Date().getDate()
            : daysInMonth);
    const expectedCalories = targetCalories * selectedDaysCount;
    const calorieDiff = totalCalories - expectedCalories;
    const caloriePercentage = expectedCalories > 0 ? (totalCalories / expectedCalories) * 100 : 0;

    return (
        <div className="min-h-screen pb-24">
            <Navigation />

            <main className="p-4 md:p-8 max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">分析レポート</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Left: Calendar */}
                    <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-50 h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">
                                {currentYear}年 {currentMonth + 1}月
                            </h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        const newDate = new Date(currentYear, currentMonth - 1);
                                        setCurrentMonth(newDate.getMonth());
                                        setCurrentYear(newDate.getFullYear());
                                        setSelectedDates([]); // Clear selection on month change
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => {
                                        const newDate = new Date(currentYear, currentMonth + 1);
                                        setCurrentMonth(newDate.getMonth());
                                        setCurrentYear(newDate.getFullYear());
                                        setSelectedDates([]); // Clear selection on month change
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                                <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square"></div>
                            ))}
                            {days.map(day => {
                                const dateStr = new Date(currentYear, currentMonth, day).toDateString();
                                const dayRecords = history.filter(h => new Date(h.date).toDateString() === dateStr);
                                const hasHighRisk = dayRecords.some(r => r.risk === "High");
                                const isSelected = selectedDates.some(d => d.toDateString() === dateStr);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${isSelected
                                            ? "bg-orange-500 text-white shadow-md transform scale-105 z-10"
                                            : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        <span className="text-xs font-medium">{day}</span>
                                        {dayRecords.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {hasHighRisk ? (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-red-400"}`}></span>
                                                ) : (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`}></span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            日付をタップして複数選択できます。<br />選択なしで今月全体を表示。
                        </p>
                    </div>

                    {/* Top Right: Food List (Scrollable) */}
                    <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-50 h-[400px] flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                            <span>食事リスト</span>
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {selectedDates.length > 0 ? `${selectedDates.length}日間` : "今月"}の記録: {displayedRecords.length}件
                            </span>
                        </h3>

                        <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
                            {displayedRecords.length > 0 ? (
                                displayedRecords.map(record => (
                                    <div
                                        key={record.id}
                                        onClick={() => setModalItem(record)}
                                        className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block mb-0.5">
                                                    {new Date(record.date).toLocaleDateString('ja-JP')}
                                                </span>
                                                <span className="font-bold text-gray-700 line-clamp-1 text-sm">{record.input}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${record.risk === "High" ? "bg-red-100 text-red-500" :
                                                record.risk === "Medium" ? "bg-yellow-100 text-yellow-600" :
                                                    "bg-blue-100 text-blue-500"
                                                }`}>
                                                {record.risk === "High" ? "高" : record.risk === "Medium" ? "中" : "低"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <p>表示する記録がありません</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Left: Pie Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex flex-col items-center justify-center min-h-[300px] relative">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                PFCバランス
                                <div className="group relative">
                                    <svg className="w-5 h-5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                        <p className="font-bold mb-1">PFCとは？</p>
                                        <ul className="space-y-0.5">
                                            <li><span className="text-pink-300">P</span>rotein = タンパク質</li>
                                            <li><span className="text-orange-300">F</span>at = 脂質</li>
                                            <li><span className="text-blue-300">C</span>arbohydrate = 炭水化物</li>
                                        </ul>
                                        <p className="mt-1 text-[10px] text-gray-300">三大栄養素のバランスです。</p>
                                    </div>
                                </div>
                            </h3>
                        </div>

                        {totalCalories > 0 ? (
                            <>
                                <div className="w-48 h-48 relative mb-4">
                                    <Doughnut
                                        data={doughnutData}
                                        options={{
                                            cutout: '70%',
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (item) => `${item.raw} kcal`
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs text-gray-400">脂質比率</span>
                                        <span className={`text-2xl font-bold ${fatRatio > 30 ? "text-red-500" : "text-orange-500"}`}>
                                            {Math.round(fatRatio)}%
                                        </span>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold text-center mb-4 ${adviceColor}`}>
                                    {adviceMessage}
                                </p>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm mb-8">データがありません</div>
                        )}

                        <div className="w-full grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col items-center p-2 bg-orange-50 rounded-xl border border-orange-100">
                                <span className="font-bold text-orange-500 mb-0.5">Fat</span>
                                <span className="text-gray-700 font-bold">{Math.round(totalFatCalories)} <span className="text-[10px] font-normal">kcal</span></span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-pink-50 rounded-xl border border-pink-100">
                                <span className="font-bold text-pink-500 mb-0.5">Protein</span>
                                <span className="text-gray-700 font-bold">{Math.round(totalProteinCalories)} <span className="text-[10px] font-normal">kcal</span></span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-blue-50 rounded-xl border border-blue-100">
                                <span className="font-bold text-blue-500 mb-0.5">Carb</span>
                                <span className="text-gray-700 font-bold">{Math.round(totalCarbCalories)} <span className="text-[10px] font-normal">kcal</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Right: Risk Breakdown */}
                    <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-700">リスク内訳</h3>
                            {riskFilter && (
                                <button
                                    onClick={() => setRiskFilter(null)}
                                    className="text-xs text-orange-500 hover:underline"
                                >
                                    絞り込み解除
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => setRiskFilter(riskFilter === "High" ? null : "High")}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${riskFilter === "High" ? "bg-red-50 border-red-200 ring-2 ring-red-100" : "bg-white border-gray-100 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold">
                                        高
                                    </div>
                                    <span className="font-bold text-gray-700">高リスク</span>
                                </div>
                                <span className="text-xl font-bold text-gray-800">{riskCounts.High} <span className="text-xs font-normal text-gray-400">件</span></span>
                            </button>

                            <button
                                onClick={() => setRiskFilter(riskFilter === "Medium" ? null : "Medium")}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${riskFilter === "Medium" ? "bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100" : "bg-white border-gray-100 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                                        中
                                    </div>
                                    <span className="font-bold text-gray-700">中リスク</span>
                                </div>
                                <span className="text-xl font-bold text-gray-800">{riskCounts.Medium} <span className="text-xs font-normal text-gray-400">件</span></span>
                            </button>

                            <button
                                onClick={() => setRiskFilter(riskFilter === "Low" ? null : "Low")}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${riskFilter === "Low" ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100" : "bg-white border-gray-100 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                                        低
                                    </div>
                                    <span className="font-bold text-gray-700">低リスク</span>
                                </div>
                                <span className="text-xl font-bold text-gray-800">{riskCounts.Low} <span className="text-xs font-normal text-gray-400">件</span></span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            タップしてリストを絞り込み
                        </p>
                    </div>
                </div>

                {/* Calorie Goal Section - Full Width */}
                <div className="mt-6 bg-white p-6 rounded-3xl shadow-soft border border-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        カロリートラッキング
                    </h3>

                    {!userProfile ? (
                        <div className="bg-blue-50 p-4 rounded-2xl text-center">
                            <p className="text-blue-600 text-sm mb-2">カロリー目標を設定すると、より詳しい分析ができます</p>
                            <a href="/settings" className="text-blue-500 underline text-sm font-bold">設定ページへ →</a>
                        </div>
                    ) : (
                        <>
                            {/* Today's Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-4 rounded-2xl text-center">
                                    <p className="text-sm text-gray-500 mb-1">目標カロリー</p>
                                    <p className="text-2xl font-bold text-gray-800">{targetCalories.toLocaleString()} <span className="text-sm font-normal">kcal</span></p>
                                    <p className="text-xs text-gray-400">1日あたり</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl text-center">
                                    <p className="text-sm text-gray-500 mb-1">期間中の摂取</p>
                                    <p className="text-2xl font-bold text-gray-800">{totalCalories.toLocaleString()} <span className="text-sm font-normal">kcal</span></p>
                                    <p className="text-xs text-gray-400">{selectedDaysCount}日間</p>
                                </div>
                                <div className={`p-4 rounded-2xl text-center ${calorieDiff > expectedCalories * 0.1 ? 'bg-red-50' : calorieDiff < -expectedCalories * 0.1 ? 'bg-blue-50' : 'bg-green-50'}`}>
                                    <p className="text-sm text-gray-500 mb-1">目標との差</p>
                                    <p className={`text-2xl font-bold ${calorieDiff > expectedCalories * 0.1 ? 'text-red-500' : calorieDiff < -expectedCalories * 0.1 ? 'text-blue-500' : 'text-green-500'}`}>
                                        {calorieDiff > 0 ? '+' : ''}{Math.round(calorieDiff).toLocaleString()} <span className="text-sm font-normal">kcal</span>
                                    </p>
                                    <p className={`text-xs ${calorieDiff > expectedCalories * 0.1 ? 'text-red-400' : calorieDiff < -expectedCalories * 0.1 ? 'text-blue-400' : 'text-green-400'}`}>
                                        {calorieDiff > expectedCalories * 0.1 ? '少し食べ過ぎかも' : calorieDiff < -expectedCalories * 0.1 ? '少し足りないかも' : 'いい感じです！'}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">達成率</span>
                                    <span className={`font-bold ${caloriePercentage > 110 ? 'text-red-500' : caloriePercentage < 80 ? 'text-blue-500' : 'text-green-500'}`}>
                                        {Math.round(caloriePercentage)}%
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${caloriePercentage > 110 ? 'bg-red-400' : caloriePercentage < 80 ? 'bg-blue-400' : 'bg-green-400'}`}
                                        style={{ width: `${Math.min(caloriePercentage, 150)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Weekly Chart */}
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <h4 className="text-sm font-bold text-gray-600 mb-4">過去7日間のカロリー推移</h4>
                                <div className="h-48">
                                    <Bar
                                        data={weeklyChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (ctx) => `${ctx.raw} kcal`
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                                    ticks: { font: { size: 10 } }
                                                },
                                                x: {
                                                    grid: { display: false },
                                                    ticks: { font: { size: 10 } }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex justify-center gap-4 mt-4 text-xs">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-green-400"></span>適正
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-red-400"></span>オーバー
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-blue-400"></span>不足
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            {modalItem && (
                <DetailModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
