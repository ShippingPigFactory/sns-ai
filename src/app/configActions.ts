'use server';

import { google } from 'googleapis';

// ペルソナの型定義
export type Persona = {
    name: string;
    target: string;
    tone: string;
    format: string;
};

export async function getPersonas(): Promise<Persona[]> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // ConfigシートのA2:D末尾まで取得
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Config!A2:D',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        // 配列をオブジェクトに変換
        return rows.map((row) => ({
            name: row[0] || '無題',
            target: row[1] || '',
            tone: row[2] || '',
            format: row[3] || '',
        }));

    } catch (error) {
        console.error("Config Load Error:", error);
        return []; // エラー時は空配列を返す
    }
}