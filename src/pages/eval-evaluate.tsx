// src/pages/eval-evaluate.tsx
import { Helmet } from 'react-helmet-async';
import { useParams, useLocation } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function EvalEvaluatePage() {
  const { id } = useParams(); // 템플릿 ID
  const location = useLocation();
  const imageIndex = location.state?.imageIndex;

  return (
    <>
      <Helmet>
        <title> Evaluate | MUI Image Eval </title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4">🧪 평가 페이지</Typography>
        <Typography>템플릿 ID: {id}</Typography>
        <Typography>선택한 이미지 번호: {imageIndex}</Typography>
      </Box>
    </>
  );
}
