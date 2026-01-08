'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { google } from 'googleapis';
import { Readable } from 'stream';

export type DraftContent = {
    body: string;
    tags: string;
};

// 型定義
type GenerateOptions = {
    memo: string;
    platform: 'Instagram' | 'X' | 'TikTok';
    persona: { target: string; tone: string; format: string }; // ペルソナ情報を受け取る
};

// 1. 生成アクション (複数画像対応 & ペルソナ対応)
export async function generateDrafts(formData: FormData) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return { success: false, error: "API Key設定エラー" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // ★成功したモデルを指定
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    draft1: {
                        type: SchemaType.OBJECT,
                        properties: { body: { type: SchemaType.STRING }, tags: { type: SchemaType.STRING } }
                    },
                    draft2: {
                        type: SchemaType.OBJECT,
                        properties: { body: { type: SchemaType.STRING }, tags: { type: SchemaType.STRING } }
                    },
                    draft3: {
                        type: SchemaType.OBJECT,
                        properties: { body: { type: SchemaType.STRING }, tags: { type: SchemaType.STRING } }
                    },
                },
                required: ["draft1", "draft2", "draft3"]
            }
        }
    });

    // フォームデータの取得
    const memo = formData.get('memo') as string;
    const platform = formData.get('platform') as string;
    const personaJson = formData.get('persona') as string;
    const persona = JSON.parse(personaJson);

    // ★複数画像の取得
    const files = formData.getAll('images') as File[]; // 'image'ではなく'images'で取得
    if (files.length === 0) return { success: false, error: "画像がありません" };

    try {
        // 画像をGemini用パーツに変換
        const imageParts = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return {
                inlineData: { data: base64, mimeType: file.type }
            };
        }));

        // プロンプトの組み立て
        const prompt = `
            あなたはプロのSNS運用担当者です。
            以下の画像とメモ、設定を元に、${platform}用の投稿文を3パターン作成してください。
            
            【投稿メモ】${memo}
            【設定】ターゲット:${persona.target} / トーン:${persona.tone} / 構成:${persona.format}
            
            【重要：出力形式】
            各案について、以下の2つに分けて出力してください。
            - body: 投稿本文（ハッシュタグは含めない）
            - tags: ハッシュタグのみ（#〇〇 #△△ の形式でスペース区切り）
            `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const content = JSON.parse(result.response.text());

        // プレビュー用に画像のBase64リストを返す（1枚目だけ代表で返すか、全部返すか）
        // ここでは1枚目を代表サムネイルとして扱います
        const firstImageBuffer = await files[0].arrayBuffer();
        const thumbnailBase64 = `data:${files[0].type};base64,${Buffer.from(firstImageBuffer).toString('base64')}`;

        return {
            success: true,
            drafts: [content.draft1, content.draft2, content.draft3] as DraftContent[], thumbnailBase64
        };

    } catch (error) {
        console.error(error);
        return { success: false, error: "AI生成エラー" };
    }
}

// 2. 投稿・保存処理 (変更なし、または必要に応じて複数枚保存に対応させる)
export async function postAndLog(finalText: string, imageBase64: string) {
    // ... (以前と同じコードでOKです。今回は省略します) ...
    // ※複数枚画像をドライブに保存したい場合は、引数を配列に変える必要がありますが、
    // まずは「サムネイル1枚保存」で進めます。
    return { success: true };
}