'use client';

import { useState, useEffect } from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Paper, Stack } from '@mui/material';
import Grid from '@mui/material/Grid'; // MUI v6
import InputForm from './components/InputForm';
import ResultView from './components/ResultView';
import LoadingOverlay from './components/LoadingOverlay';
import { generateDrafts, postAndLog, DraftContent } from './actions';
import { getPersonas, Persona } from './configActions';
import StyleAnalyzer from './components/StyleAnalyzer';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  // 入力データ
  const [memo, setMemo] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [personaIndex, setPersonaIndex] = useState(0);

  // 生成結果データ
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [thumbnailBase64, setThumbnailBase64] = useState<string>("");

  // ペルソナ情報
  const [personas, setPersonas] = useState<Persona[]>([]);

  // useEffectの中身を関数として外に出す
  const fetchPersonas = async () => {
    const data = await getPersonas();
    setPersonas(data);
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('memo', memo);
    formData.append('platform', platform);

    const currentPersona = personas[personaIndex] || { target: '', tone: '', format: '' };
    formData.append('persona', JSON.stringify(currentPersona));

    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const result = await generateDrafts(formData);
      if (result.success && result.drafts) {
        setDrafts(result.drafts);
        if (result.thumbnailBase64) {
          setThumbnailBase64(result.thumbnailBase64);
        }
        // ★以前のような setStep('result') は不要
      } else {
        alert('生成に失敗しました: ' + result.error);
      }
    } catch (e) {
      alert('エラーが発生しました');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async (finalText: string) => {
    if (!confirm('この内容で投稿しますか？')) return;
    setIsLoading(true);
    try {
      await postAndLog(finalText, thumbnailBase64);
      alert('投稿＆保存が完了しました！');
      // 投稿後は結果だけクリアして、次の投稿に移りやすくする
      setDrafts([]);
      setImageFiles([]);
    } catch (e) {
      alert('投稿に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            ✨ SNS AI投稿メーカー
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* ★ここからGridレイアウトに変更 */}
        <Grid container spacing={3}>

          {/* 左カラム：入力エリア */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                📝 ネタ・設定入力
              </Typography>
              <InputForm
                memo={memo} setMemo={setMemo}
                platform={platform} setPlatform={setPlatform}
                personaIndex={personaIndex} setPersonaIndex={setPersonaIndex}
                imageFiles={imageFiles} setImageFiles={setImageFiles}
                onSubmit={handleGenerate}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                personas={personas}
              />
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <StyleAnalyzer
                  onSuccess={fetchPersonas}
                  personas={personas}
                />
              </Box>
            </Paper>
          </Grid>

          {/* 右カラム：結果エリア */}
          <Grid size={{ xs: 12, md: 7 }}>
            {drafts.length > 0 ? (
              // 結果がある場合
              <ResultView
                drafts={drafts}
                originalImage={imageFiles.length > 0 ? imageFiles[0] : null}
                platform={platform}
                // setPlatformは左画面で変えられるので不要
                onPost={handlePost}
              />
            ) : (
              // 結果がまだない場合（プレースホルダー）
              <Paper
                elevation={0}
                sx={{
                  p: 3, height: '100%', minHeight: 400, borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'transparent', border: '2px dashed #ccc'
                }}
              >
                <Stack alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                  <Typography variant="h5">👈 左側に入力して生成！</Typography>
                  <Typography variant="body1">
                    ここにAIが作成した3つの案と編集画面が表示されます。
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      <LoadingOverlay open={isLoading} />
    </Box>
  );
}