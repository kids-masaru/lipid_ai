"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

// User profile interface
export interface UserProfile {
    age: number;
    gender: "male" | "female";
    height: number; // cm
    weight: number; // kg
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
    targetCalories: number; // Calculated or custom
}

const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "座り仕事中心", factor: 1.2 },
    { value: "light", label: "軽い運動", factor: 1.375 },
    { value: "moderate", label: "適度な運動", factor: 1.55 },
    { value: "active", label: "活発な運動", factor: 1.725 },
    { value: "very_active", label: "とても活発", factor: 1.9 },
];

const STORAGE_KEY = "lipid-ai-user-profile";

// Calculate BMR using Mifflin-St Jeor Equation (more accurate than Harris-Benedict)
function calculateBMR(gender: string, weight: number, height: number, age: number): number {
    if (gender === "male") {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
}

// Calculate TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr: number, activityLevel: string): number {
    const activity = ACTIVITY_LEVELS.find(a => a.value === activityLevel);
    return Math.round(bmr * (activity?.factor || 1.2));
}

export function getUserProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function saveUserProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export default function SettingsPage() {
    const [age, setAge] = useState(30);
    const [gender, setGender] = useState<"male" | "female">("male");
    const [height, setHeight] = useState(170);
    const [weight, setWeight] = useState(65);
    const [activityLevel, setActivityLevel] = useState<UserProfile["activityLevel"]>("light");
    const [useCustomCalories, setUseCustomCalories] = useState(false);
    const [customCalories, setCustomCalories] = useState(2000);
    const [saved, setSaved] = useState(false);

    // Load existing profile
    useEffect(() => {
        const profile = getUserProfile();
        if (profile) {
            setAge(profile.age);
            setGender(profile.gender);
            setHeight(profile.height);
            setWeight(profile.weight);
            setActivityLevel(profile.activityLevel);
            if (profile.targetCalories !== calculateTDEE(calculateBMR(profile.gender, profile.weight, profile.height, profile.age), profile.activityLevel)) {
                setUseCustomCalories(true);
                setCustomCalories(profile.targetCalories);
            }
        }
    }, []);

    // Calculate current TDEE
    const bmr = calculateBMR(gender, weight, height, age);
    const tdee = calculateTDEE(bmr, activityLevel);
    const targetCalories = useCustomCalories ? customCalories : tdee;

    const handleSave = () => {
        const profile: UserProfile = {
            age,
            gender,
            height,
            weight,
            activityLevel,
            targetCalories,
        };
        saveUserProfile(profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen pb-24">
            <Navigation />

            <main className="p-4 md:p-8 max-w-2xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">設定</h1>
                <p className="text-gray-500 mb-8">あなたに合ったカロリー目標を設定します</p>

                <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        基本情報
                    </h2>

                    <div className="space-y-5">
                        {/* Gender */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">性別</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setGender("male")}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${gender === "male"
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                >
                                    男性
                                </button>
                                <button
                                    onClick={() => setGender("female")}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${gender === "female"
                                        ? "bg-pink-500 text-white shadow-md"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                >
                                    女性
                                </button>
                            </div>
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">年齢</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="15"
                                    max="90"
                                    value={age}
                                    onChange={(e) => setAge(parseInt(e.target.value))}
                                    className="flex-1 accent-orange-500"
                                />
                                <span className="text-lg font-bold text-gray-800 min-w-[60px] text-right">{age} 歳</span>
                            </div>
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">身長</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="140"
                                    max="200"
                                    value={height}
                                    onChange={(e) => setHeight(parseInt(e.target.value))}
                                    className="flex-1 accent-orange-500"
                                />
                                <span className="text-lg font-bold text-gray-800 min-w-[70px] text-right">{height} cm</span>
                            </div>
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">体重</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="35"
                                    max="150"
                                    value={weight}
                                    onChange={(e) => setWeight(parseInt(e.target.value))}
                                    className="flex-1 accent-orange-500"
                                />
                                <span className="text-lg font-bold text-gray-800 min-w-[60px] text-right">{weight} kg</span>
                            </div>
                        </div>

                        {/* Activity Level */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">運動量</label>
                            <select
                                value={activityLevel}
                                onChange={(e) => setActivityLevel(e.target.value as UserProfile["activityLevel"])}
                                className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 border border-gray-100 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                            >
                                {ACTIVITY_LEVELS.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Calorie Goal Section */}
                <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        1日の目標カロリー
                    </h2>

                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-2xl mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">基礎代謝量 (BMR)</span>
                            <span className="font-bold text-gray-800">{Math.round(bmr)} kcal</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">推奨摂取カロリー (TDEE)</span>
                            <span className="font-bold text-orange-600 text-lg">{tdee} kcal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            id="customCalories"
                            checked={useCustomCalories}
                            onChange={(e) => setUseCustomCalories(e.target.checked)}
                            className="w-5 h-5 accent-orange-500"
                        />
                        <label htmlFor="customCalories" className="text-sm text-gray-600">
                            カスタム目標を設定する
                        </label>
                    </div>

                    {useCustomCalories && (
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={customCalories}
                                onChange={(e) => setCustomCalories(parseInt(e.target.value) || 0)}
                                className="flex-1 bg-gray-50 text-gray-800 rounded-xl px-4 py-3 border border-gray-100 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                                placeholder="例: 1800"
                            />
                            <span className="text-gray-500">kcal</span>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-102 active:scale-98 ${saved
                        ? "bg-green-500 shadow-green-200"
                        : "bg-gradient-to-r from-orange-400 to-pink-500 shadow-orange-200"
                        }`}
                >
                    {saved ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            保存しました！
                        </span>
                    ) : (
                        "設定を保存"
                    )}
                </button>

                {/* Info about calorie tracking */}
                <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-gray-600">
                            <p className="font-bold text-gray-700 mb-1">カロリー目標について</p>
                            <p>設定した目標カロリーは、分析ページで食事記録と比較されます。目標に対して多すぎる・少なすぎる場合はアドバイスが表示されます。</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
