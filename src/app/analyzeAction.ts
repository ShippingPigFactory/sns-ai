'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { google } from 'googleapis';

// 1. Referenceシートから投稿テキストを取得
async function fetchReferencePosts(): Promise<string[]> {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Reference!A2:A50', // 最大50件ほど分析すれば十分
        });

        const rows = response.data.values;
        if (!rows) return [];

        // 空行を除去して配列化
        return rows.map(r => r[0]).filter(Boolean);
    } catch (error) {
        console.error("Reference Fetch Error:", error);
        return [];
    }
}

export async function analyzeAndSavePersona(personaName: string) {
    try {
        // 1. データ取得とAI分析（ここは同じ）
        const posts = await fetchReferencePosts();
        if (posts.length < 3) return { success: false, error: "Referenceデータ不足" };

        const apiKey = process.env.GOOGLE_API_KEY!;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        target: { type: SchemaType.STRING },
                        tone: { type: SchemaType.STRING },
                        format: { type: SchemaType.STRING },
                    },
                    required: ["target", "tone", "format"]
                }
            }
        });

        const prompt = `
      あなたはSNSコンサルタントです。
      以下の投稿データを分析し、このアカウントの現在の「勝ちパターン」を抽出してください。
      既存の設定をアップデートするため、最新の傾向を反映させてください。

      【分析データ】
      ${posts.join("\n---\n")}

      【出力項目】
      - target: ターゲット層
      - tone: 文体・トーン
      - format: 構成ルール
    `;

        const result = await model.generateContent(prompt);
        const analysis = JSON.parse(result.response.text());

        // 2. 保存処理（分岐ロジック）
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // まず既存の名前リストを取得して検索
        const nameListResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Config!A:A', // A列（名前）だけ取得
        });

        const rows = nameListResponse.data.values || [];
        // 既存の行を探す（見つからなければ -1）
        // rows[i][0] が名前。i=0はヘッダーなので注意
        const rowIndex = rows.findIndex(row => row[0] === personaName);

        if (rowIndex !== -1) {
            // ■ パターンA: 更新（上書き）
            // rowIndexは0始まりの配列インデックス。スプレッドシートの行番号は +1 される。
            // かつ、配列0番目が「行1」なので、rowIndex + 1 が行番号。
            const sheetRowNumber = rowIndex + 1;

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Config!B${sheetRowNumber}:D${sheetRowNumber}`, // B,C,D列を更新
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[analysis.target, analysis.tone, analysis.format]]
                }
            });
            return { success: true, mode: 'update', name: personaName };

        } else {
            // ■ パターンB: 新規追加
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Config!A:D',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[personaName, analysis.target, analysis.tone, analysis.format]]
                }
            });
            return { success: true, mode: 'create', name: personaName };
        }

    } catch (error) {
        console.error("Analyze Error:", error);
        return { success: false, error: "処理に失敗しました" };
    }
}
