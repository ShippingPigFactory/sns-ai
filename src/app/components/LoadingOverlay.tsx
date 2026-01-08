'use client';

import { Backdrop, CircularProgress, Typography, Stack } from '@mui/material';

type Props = {
    open: boolean;
};

export default function LoadingOverlay({ open }: Props) {
    return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={open}
        >
            <Stack alignItems="center" spacing={2}>
                <CircularProgress color="inherit" size={60} />
                <Typography variant="h6">AIが画像を分析して執筆中...</Typography>
                <Typography variant="body2">10〜20秒ほどお待ちください</Typography>
            </Stack>
        </Backdrop>
    );
}