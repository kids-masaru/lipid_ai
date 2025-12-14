import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { text, modelName, mealType, image } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key is missing");
            return NextResponse.json(
                { error: "APIキーが設定されていません。.env.localを確認してください。" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use selected model or default to gemini-2.5-flash as requested
        const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.5-flash" });

        const prompt = `
あなたは脂質（コレステロール・中性脂肪）専門の管理栄養士です。
以下の食品（テキストまたは画像）を分析し、**JSON形式**で結果を返してください。
複数の食品が含まれている場合は、それぞれの食品ごとに配列の要素を作成してください。

【重要】リスク評価について
- "Low"リスクを優先的に使用してください。一般的な家庭料理や和食は多くの場合"Low"です。
- "Medium"は脂っこい料理や甘い物など、やや注意が必要な場合に使用。
- "High"は揚げ物中心、高脂肪食品、極端に偏った食事のみに使用。
- 厳しすぎる評価は避けてください。バランスの取れた普通の食事は"Low"としてください。

【出力フォーマット】
以下のJSON配列のみを出力してください。マークダウン記法（\`\`\`jsonなど）は含めないでください。

[
  {
    "name": "食品名（具体的かつ短く）",
    "risk": "High" | "Medium" | "Low",
    "reason": "リスクの理由（短く端的に、Lowの場合は良い点を述べる）",
    "alternatives": "代替案（Lowの場合は「今のままで良いです」など）",
    "frequency": "頻度の目安（Lowの場合は「問題なく毎日OK」など肯定的に）",
    "calories": number,
    "protein": number,
    "fat": number,
    "carbohydrates": number,
    "saturated_fat": number,
    "dietary_fiber": number,
    "sodium": number, // ナトリウム (mg)
    "calcium": number, // カルシウム (mg)
    "iron": number, // 鉄分 (mg)
    "vitamin_c": number, // ビタミンC (mg)
    "vitamin_d": number, // ビタミンD (μg)
    "cholesterol_impact": {
      "level": "High" | "Medium" | "Low" | "None",
      "reason": "理由（短く）"
    },
    "neutral_fat_impact": {
      "level": "High" | "Medium" | "Low" | "None",
      "reason": "理由（短く）"
    },
    "nutrition_tips": [
      {
        "nutrient": "栄養素名",
        "status": "豊富" | "適量" | "不足気味" | "過剰気味",
        "advice": "簡潔なアドバイス（1行）"
      }
    ],
    "overall_advice": "この食事についての全体的なコメント（1-2行、ポジティブな表現を心がける）"
  }
]

【分析対象】
摂取タイミング: ${mealType || "指定なし"}
内容: ${text || "画像を参照"}
`;


        let result;
        if (image) {
            const imagePart = {
                inlineData: {
                    data: image.split(",")[1],
                    mimeType: "image/jpeg",
                },
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        const responseText = result.response.text();
        // Clean up markdown code blocks if present, just in case
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        return NextResponse.json({ result: JSON.parse(jsonString) });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: `AI分析中にエラーが発生しました: ${error.message}` },
            { status: 500 }
        );
    }
}
