'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import {
  Box, Button, TextField, Stack, Card, CardMedia, IconButton,
  MenuItem, Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getPersonas, Persona } from '@/app/configActions';

// ★親から受け取るデータと変更関数を定義
type Props = {
  memo: string;
  setMemo: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  personaIndex: number;
  setPersonaIndex: (v: number) => void;
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  onSubmit: () => void; // 引数なしに変更（親がデータを持ってるので）
  isLoading: boolean;
};

export default function InputForm({
  memo, setMemo, platform, setPlatform, personaIndex, setPersonaIndex,
  imageFiles, setImageFiles, onSubmit, isLoading
}: Props) {

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // ペルソナ読み込み
  useEffect(() => {
    getPersonas().then(data => setPersonas(data));
  }, []);

  // 画像プレビューURLの生成（imageFilesが変わるたびに更新）
  useEffect(() => {
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    // クリーンアップ
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImageFiles([...imageFiles, ...newFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>

      {/* 1. 媒体選択 */}
      <ToggleButtonGroup
        color="primary"
        value={platform}
        exclusive
        onChange={(_, newPlatform) => newPlatform && setPlatform(newPlatform)}
        fullWidth
      >
        <ToggleButton value="Instagram">Instagram</ToggleButton>
        <ToggleButton value="X">X (Twitter)</ToggleButton>
        <ToggleButton value="TikTok">TikTok</ToggleButton>
      </ToggleButtonGroup>

      {/* 2. ペルソナ選択 */}
      <FormControl fullWidth>
        <InputLabel>ペルソナ / 設定プロファイル</InputLabel>
        <Select
          value={personaIndex}
          label="ペルソナ / 設定プロファイル"
          onChange={(e) => setPersonaIndex(Number(e.target.value))}
        >
          {personas.length === 0 ? (
            <MenuItem value={0}>読み込み中...</MenuItem>
          ) : (
            personas.map((p, i) => (
              <MenuItem key={i} value={i}>
                {p.name} ({p.tone})
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* 3. 画像アップロード */}
      <Box>
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCamera />}
          sx={{ width: '100%', height: 60, mb: 2 }}
        >
          写真を追加 (現在 {imageFiles.length} 枚)
          <input hidden accept="image/*" multiple type="file" onChange={handleImageChange} />
        </Button>

        <Grid container spacing={1}>
          {previewUrls.map((url, index) => (
            <Grid key={index} size={{ xs: 4 }}>
              <Card variant="outlined" sx={{ position: 'relative' }}>
                <CardMedia component="img" image={url} sx={{ height: 100, objectFit: 'cover' }} />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveImage(index)}
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.9)' }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 4. メモ入力 */}
      <TextField
        label="メモ / 伝えたいこと"
        multiline
        rows={3}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        fullWidth
        placeholder="例：新商品が入荷しました。"
      />

      {/* 5. 生成ボタン */}
      <Button
        variant="contained"
        size="large"
        onClick={onSubmit}
        disabled={isLoading || imageFiles.length === 0}
        startIcon={<AutoAwesomeIcon />}
        sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
      >
        {isLoading ? 'AIが生成中...' : '生成する'}
      </Button>
    </Stack>
  );
}