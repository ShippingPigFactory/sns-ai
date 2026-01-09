'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Stack, Typography, Card, CardContent, CardActionArea,
  Chip, Tooltip, Snackbar, Alert, CardMedia
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { DraftContent } from '@/app/actions';

type Props = {
  drafts: DraftContent[];
  // onBack は不要になりました
  onPost: (finalText: string) => void;
  originalImage: File | null;
  platform: string;
};

export default function ResultView({ drafts, onPost, originalImage, platform }: Props) {
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getPlatformIcon = () => {
    switch (platform) {
      case 'Instagram': return <InstagramIcon fontSize="small" />;
      case 'X': return <XIcon fontSize="small" />;
      case 'TikTok': return <MusicNoteIcon fontSize="small" />;
      default: return undefined;
    }
  };

  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalImage]);

  // draftsが変わったら（再生成されたら）内容を更新
  useEffect(() => {
    if (drafts.length > 0) {
      // 選択状態をリセット
      setSelectedIndex(0);
      setBody(drafts[0].body);
      setTags(drafts[0].tags);
    }
  }, [drafts]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setBody(drafts[index].body);
    setTags(drafts[index].tags);
  };

  const handleCopy = () => {
    const textToCopy = `【${platform}投稿案】\n\n${body}\n\n${tags}`;
    navigator.clipboard.writeText(textToCopy);
    setToastOpen(true);
  };

  const handlePost = () => {
    const fullText = `${body}\n\n${tags}`;
    onPost(fullText);
  };

  return (
    <Stack spacing={3}>

      {/* ヘッダー */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip
          icon={getPlatformIcon()}
          label={`${platform}向けの提案`}
          color="primary"
          sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          気に入った案をクリックして選択してください
        </Typography>
      </Stack>

      {/* 3案リスト */}
      <Grid container spacing={2}>
        {drafts.map((draft, index) => (
          <Grid key={index} size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderColor: selectedIndex === index ? 'primary.main' : 'divider',
                borderWidth: selectedIndex === index ? 3 : 1, // 選択中をより太く
                bgcolor: selectedIndex === index ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s'
              }}
            >
              <CardActionArea onClick={() => handleSelect(index)} sx={{ height: '100%', p: 1 }}>
                <CardContent>
                  <Chip
                    label={`案 ${index + 1}`}
                    color={selectedIndex === index ? "primary" : "default"}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" sx={{
                    display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {draft.body}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 編集エリア */}
      <Card variant="outlined" sx={{ p: 3, boxShadow: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">✍️ 編集エリア</Typography>
            <Tooltip title="承認依頼用にコピー">
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopy} size="small">
                テキストをコピー
              </Button>
            </Tooltip>
          </Stack>

          <TextField
            label="投稿本文"
            multiline
            minRows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            sx={{ bgcolor: '#fff' }}
          />
          <TextField
            label="ハッシュタグ"
            multiline
            minRows={2}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            fullWidth
            sx={{ bgcolor: '#f9f9f9' }}
          />

          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<SendIcon />}
            onClick={handlePost}
            sx={{ py: 1.5, fontSize: '1.2rem', fontWeight: 'bold', mt: 1 }}
          >
            この内容で投稿する
          </Button>
        </Stack>
      </Card>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">コピーしました！</Alert>
      </Snackbar>
    </Stack>
  );
}