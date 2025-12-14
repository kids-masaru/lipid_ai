"use client";

import { useState, useRef, useEffect } from "react";
import { saveResult, AnalysisResult, getHistory } from "./utils/storage";

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-pro",
];

const MEAL_TYPES: { value: AnalysisResult["mealType"]; label: string; path: string }[] = [
  { value: "Breakfast", label: "朝食", path: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  { value: "Lunch", label: "昼食", path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { value: "Dinner", label: "夕食", path: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
  { value: "Snack", label: "間食", path: "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" },
];

type NutritionTip = {
  nutrient: string;
  status: "豊富" | "適量" | "不足気味" | "過剰気味";
  advice: string;
};

type AnalysisItem = {
  name: string;
  risk: "High" | "Medium" | "Low";
  reason: string;
  alternatives: string;
  frequency: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  saturated_fat: number;
  dietary_fiber: number;
  sodium?: number;
  calcium?: number;
  iron?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  cholesterol_impact?: {
    level: "High" | "Medium" | "Low" | "None";
    reason: string;
  };
  neutral_fat_impact?: {
    level: "High" | "Medium" | "Low" | "None";
    reason: string;
  };
  nutrition_tips?: NutritionTip[];
  overall_advice?: string;
};

export default function Page() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<AnalysisItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [selectedMeal, setSelectedMeal] = useState<AnalysisResult["mealType"]>("Lunch");
  const [weeklyInsight, setWeeklyInsight] = useState<{ count: number, topItems: string[] } | null>(null);

  useEffect(() => {
    const history = getHistory();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentHighRisk = history.filter(h =>
      new Date(h.date) >= oneWeekAgo && h.risk === "High"
    );

    if (recentHighRisk.length > 0) {
      const itemCounts: Record<string, number> = {};
      recentHighRisk.forEach(h => {
        const name = h.input.split(/[、,]/)[0]; // Simple extraction
        itemCounts[name] = (itemCounts[name] || 0) + 1;
      });

      const sortedItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      setWeeklyInsight({
        count: recentHighRisk.length,
        topItems: sortedItems
      });
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleAdvice() {
    if (!input.trim() && !image) return;

    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        body: JSON.stringify({
          text: input,
          modelName: selectedModel,
          mealType: selectedMeal,
          image: image
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setResults(data.result);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = (item: AnalysisItem) => {
    const resultText = `【リスク】${item.risk === "High" ? "高" : item.risk === "Medium" ? "中" : "低"}\n【理由】${item.reason}\n【代替案】${item.alternatives}\n【頻度】${item.frequency}`;

    // Pass nutrition data to saveResult
    const nutrition = {
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbohydrates: item.carbohydrates,
      saturated_fat: item.saturated_fat,
      dietary_fiber: item.dietary_fiber,
    };

    const impact = {
      cholesterol: item.cholesterol_impact || { level: "None", reason: "" },
      neutral_fat: item.neutral_fat_impact || { level: "None", reason: "" },
    };

    saveResult(item.name, resultText, selectedMeal, item.risk, nutrition, impact, selectedDate);
    alert(`${item.name} を ${selectedDate} として記録しました`);

    // Remove saved item from list
    if (results) {
      const newResults = results.filter(r => r !== item);
      setResults(newResults.length > 0 ? newResults : null);
      if (newResults.length === 0) {
        setInput("");
        setImage(null);
      }
    }
  };

  const handleCancel = (item: AnalysisItem) => {
    if (results) {
      const newResults = results.filter(r => r !== item);
      setResults(newResults.length > 0 ? newResults : null);
      if (newResults.length === 0) {
        setInput("");
        setImage(null);
      }
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto pb-32">
      <header className="mb-12 text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/icon-192.png"
            alt="Lipid-AI"
            className="w-20 h-20 rounded-2xl shadow-lg border-2 border-white"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">
          Lipid-AI <span className="text-orange-500 text-2xl align-top">7.2</span>
        </h1>
        <p className="text-gray-500">脂質管理の専門家AIが、あなたの食事を分析します。</p>
      </header>

      {/* Weekly Insight Card */}
      {weeklyInsight && weeklyInsight.count > 2 && (
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl mb-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 blur-2xl"></div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white p-3 rounded-full shadow-sm text-orange-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">今週の振り返り</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                過去1週間で<span className="font-bold text-red-500">高リスク</span>な食事が
                <span className="font-bold text-lg mx-1">{weeklyInsight.count}回</span>ありました。
                特に<span className="font-bold text-gray-700">「{weeklyInsight.topItems.join("・")}」</span>などが続いています。
                今日は少し控えめにしてみませんか？
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white p-8 rounded-3xl shadow-soft mb-8 border border-gray-50 transition-all hover:shadow-lg">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedMeal(type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedMeal === type.value
                ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={type.path} />
              </svg>
              {type.label}
            </button>
          ))}
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm text-gray-500 font-medium">記録日</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-50 text-gray-700 text-sm rounded-xl px-4 py-2 border border-gray-100 focus:ring-2 focus:ring-orange-200 focus:outline-none"
          />
        </div>

        <div className="relative mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：牛丼並盛、サラダ、味噌汁"
            className="w-full bg-gray-50 text-gray-800 rounded-2xl p-4 pr-24 h-32 focus:ring-2 focus:ring-orange-200 focus:outline-none resize-none placeholder-gray-400 border-none transition-all"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            {/* Camera Capture Button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-orange-500 transition-colors bg-white rounded-xl shadow-sm hover:shadow-md"
              title="カメラで撮影"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* Gallery Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-orange-500 transition-colors bg-white rounded-xl shadow-sm hover:shadow-md"
              title="画像をアップロード"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          {/* Camera Input (with capture attribute for mobile) */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          {/* Gallery Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {image && (
          <div className="mb-6 relative group">
            <img src={image} alt="Upload preview" className="w-full h-48 object-cover rounded-2xl border-2 border-gray-100" />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-white/90 text-gray-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-50 text-gray-500 text-xs rounded-lg px-3 py-2 border-none focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <button
            onClick={handleAdvice}
            disabled={loading || (!input && !image)}
            className={`px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base ${loading || (!input && !image)
              ? "bg-gray-300 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-orange-400 to-pink-500 shadow-orange-200"
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                分析中...
              </>
            ) : (
              <>
                分析する
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-slide-up">
          {results.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 relative overflow-hidden group hover:border-orange-100 transition-all">
              {/* Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{item.name}</h2>
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.risk === "High" ? "bg-red-100 text-red-500" :
                      item.risk === "Medium" ? "bg-yellow-100 text-yellow-600" :
                        "bg-blue-100 text-blue-500"
                      }`}>
                      総合リスク: {item.risk === "High" ? "高" : item.risk === "Medium" ? "中" : "低"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancel(item)}
                    className="p-2 text-gray-300 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-50"
                    title="キャンセル"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSave(item)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    記録
                  </button>
                </div>
              </div>

              {/* Specific Impact Analysis */}
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
                  <span className="text-sm font-bold text-gray-700">{item.calories} <span className="text-[10px] font-normal">kcal</span></span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-400 font-bold mb-0.5">タンパク質</span>
                  <span className="text-sm font-bold text-gray-700">{item.protein} <span className="text-[10px] font-normal">g</span></span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-400 font-bold mb-0.5">脂質</span>
                  <span className="text-sm font-bold text-gray-700">{item.fat} <span className="text-[10px] font-normal">g</span></span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-400 font-bold mb-0.5">炭水化物</span>
                  <span className="text-sm font-bold text-gray-700">{item.carbohydrates} <span className="text-[10px] font-normal">g</span></span>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl text-center border border-orange-100">
                  <span className="block text-[10px] text-orange-400 font-bold mb-0.5">飽和脂肪酸</span>
                  <span className="text-sm font-bold text-orange-600">{item.saturated_fat} <span className="text-[10px] font-normal">g</span></span>
                </div>
                <div className="bg-green-50 p-2 rounded-xl text-center border border-green-100">
                  <span className="block text-[10px] text-green-500 font-bold mb-0.5">食物繊維</span>
                  <span className="text-sm font-bold text-green-600">{item.dietary_fiber} <span className="text-[10px] font-normal">g</span></span>
                </div>
              </div>

              {/* Advice Body */}
              <div className="space-y-3 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl">
                <div>
                  <span className="font-bold text-gray-400 text-xs block mb-1">リスクの理由</span>
                  {item.reason}
                </div>
                <div>
                  <span className="font-bold text-gray-400 text-xs block mb-1">代替案</span>
                  {item.alternatives}
                </div>
                <div>
                  <span className="font-bold text-gray-400 text-xs block mb-1">頻度の目安</span>
                  {item.frequency}
                </div>
              </div>

              {/* Overall Advice */}
              {item.overall_advice && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl mb-4 border border-green-100">
                  <div className="flex gap-2 items-start">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-700">{item.overall_advice}</p>
                  </div>
                </div>
              )}

              {/* Nutrition Tips */}
              {item.nutrition_tips && item.nutrition_tips.length > 0 && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <span className="font-bold text-blue-500 text-xs block mb-3">🍏 栄養素アドバイス</span>
                  <div className="space-y-2">
                    {item.nutrition_tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${tip.status === "豊富" ? "bg-green-100 text-green-600" :
                          tip.status === "適量" ? "bg-blue-100 text-blue-600" :
                            tip.status === "不足気味" ? "bg-yellow-100 text-yellow-600" :
                              "bg-red-100 text-red-600"
                          }`}>
                          {tip.nutrient}: {tip.status}
                        </span>
                        <span className="text-gray-600">{tip.advice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
