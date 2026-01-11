'use client';

import { useState } from 'react';
import {
    Button, Dialog, DialogTitle, DialogContent, DialogContentText,
    TextField, DialogActions, CircularProgress,
    FormControl, FormControlLabel, Radio, RadioGroup, Select, MenuItem, InputLabel, Box
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { analyzeAndSavePersona } from '@/app/analyzeAction';
import { Persona } from '@/app/configActions';

type Props = {
    onSuccess: () => void;
    personas: Persona[]; // ★既存リストを受け取る
};

export default function StyleAnalyzer({ onSuccess, personas }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // モード管理 ('new' | 'update')
    const [mode, setMode] = useState<'new' | 'update'>('new');
    // 入力値
    const [newName, setNewName] = useState('');
    const [selectedPersonaName, setSelectedPersonaName] = useState('');

    const handleAnalyze = async () => {
        // 送信する名前を決定
        const targetName = mode === 'new' ? newName : selectedPersonaName;

        if (!targetName) return alert("名前を入力または選択してください");

        setLoading(true);
        try {
            const result = await analyzeAndSavePersona(targetName);

            if (result.success) {
                const msg = result.mode === 'update'
                    ? `「${targetName}」の設定を最新データで上書きしました！`
                    : `「${targetName}」を新規作成しました！`;

                alert(msg);
                setOpen(false);
                setNewName('');
                onSuccess(); // リロード
            } else {
                alert("エラー: " + result.error);
            }
        } catch (e) {
            alert("予期せぬエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="text"
                size="small"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setOpen(true)}
            >
                シートからスタイル学習
            </Button>

            <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>スタイルの分析・学習</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2, fontSize: '0.9rem' }}>
                        Referenceシートの投稿データを分析し、設定を作成または更新します。
                    </DialogContentText>

                    {/* モード選択 */}
                    <FormControl component="fieldset">
                        <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as 'new' | 'update')}>
                            <FormControlLabel value="new" control={<Radio />} label="新規作成" />
                            <FormControlLabel value="update" control={<Radio />} label="既存を更新" />
                        </RadioGroup>
                    </FormControl>

                    <Box sx={{ mt: 2 }}>
                        {mode === 'new' ? (
                            <TextField
                                autoFocus
                                label="新しい設定名"
                                fullWidth
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="例: 2026春トレンド"
                                disabled={loading}
                            />
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>更新するペルソナ</InputLabel>
                                <Select
                                    value={selectedPersonaName}
                                    label="更新するペルソナ"
                                    onChange={(e) => setSelectedPersonaName(e.target.value)}
                                    disabled={loading}
                                >
                                    {personas.map((p, i) => (
                                        <MenuItem key={i} value={p.name}>{p.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={loading}>キャンセル</Button>
                    <Button onClick={handleAnalyze} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : (mode === 'new' ? "新規作成" : "上書き保存")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}