'use client';

import { useState, useEffect } from 'react';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import InputForm from '@/app/components/InputForm';
import ResultView from '@/app/components/ResultView';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { generateDrafts, postAndLog, DraftContent } from './actions';
import { getPersonas, Persona } from './configActions'; // 追加

export default function Home() {
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [isLoading, setIsLoading] = useState(false);

  // ★入力データをここで保持する（リフトアップ）
  const [memo, setMemo] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [personaIndex, setPersonaIndex] = useState(0);

  // 生成結果データ
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [thumbnailBase64, setThumbnailBase64] = useState<string>("");

  // ペルソナ情報（生成時に送るためここで取得）
  const [personas, setPersonas] = useState<Persona[]>([]);
  useEffect(() => {
    getPersonas().then(data => setPersonas(data));
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);

    // FormDataの組み立て
    const formData = new FormData();
    formData.append('memo', memo);
    formData.append('platform', platform);

    // 現在選択されているペルソナを送る
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
        setStep('result');
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

      // ★リセット処理（画像と生成結果だけ消す。設定は残す）
      setStep('input');
      setDrafts([]);
      setImageFiles([]); // 画像はリセット
      // setMemo(""); // メモは残してもいいし消してもいい
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

      <Container maxWidth="md" sx={{ py: 4 }}>
        {step === 'input' ? (
          <InputForm
            // ★StateとSetterを渡す
            memo={memo} setMemo={setMemo}
            platform={platform} setPlatform={setPlatform}
            personaIndex={personaIndex} setPersonaIndex={setPersonaIndex}
            imageFiles={imageFiles} setImageFiles={setImageFiles}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        ) : (
          <ResultView
            drafts={drafts}
            // ★プレビュー用に配列の1枚目を渡す
            originalImage={imageFiles.length > 0 ? imageFiles[0] : null}
            platform={platform} // ★媒体名を渡す
            onBack={() => setStep('input')}
            onPost={handlePost}
          />
        )}
      </Container>
      <LoadingOverlay open={isLoading} />
    </Box>
  );
}