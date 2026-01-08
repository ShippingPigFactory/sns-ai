'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Stack, Typography, Card, CardContent, CardActionArea,
  Chip, Tooltip, Snackbar, Alert, CardMedia
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // TikTok用
import { DraftContent } from '@/app/actions';

type Props = {
  drafts: DraftContent[];
  onBack: () => void;
  onPost: (finalText: string) => void;
  originalImage: File | null;
  platform: string; // ★ここを追加
};

export default function ResultView({ drafts, onBack, onPost, originalImage, platform }: Props) {
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 媒体アイコンの出し分け
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

  useEffect(() => {
    if (drafts.length > 0) {
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
    <Stack spacing={3} sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>

      {/* ヘッダー */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>戻る</Button>

        {/* ★媒体バッジの表示 */}
        <Chip
          icon={getPlatformIcon()}
          label={`${platform}向け`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />

        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
          編集・確認
        </Typography>
      </Stack>

      {/* 以下、変更なし（画像プレビュー、Grid、編集エリア...） */}
      {previewUrl && (
        <Box sx={{ textAlign: 'center' }}>
          <CardMedia
            component="img"
            src={previewUrl}
            sx={{ maxHeight: 200, objectFit: 'contain', borderRadius: 2 }}
          />
        </Box>
      )}

      <Grid container spacing={2}>
        {drafts.map((draft, index) => (
          <Grid key={index} size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderColor: selectedIndex === index ? 'primary.main' : 'divider',
                borderWidth: selectedIndex === index ? 2 : 1,
                bgcolor: selectedIndex === index ? 'primary.50' : 'background.paper'
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

      <Card variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">編集エリア</Typography>
            <Tooltip title="承認依頼用にコピー">
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopy} size="small">
                承認用にコピー
              </Button>
            </Tooltip>
          </Stack>

          <TextField
            label="投稿本文"
            multiline
            minRows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
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
        </Stack>
      </Card>

      <Button
        variant="contained"
        color="secondary"
        size="large"
        startIcon={<SendIcon />}
        onClick={handlePost}
        sx={{ py: 1.5, fontSize: '1.1rem' }}
      >
        SNSへ投稿する
      </Button>

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