import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

export function EvalDetailView() {
  const { id } = useParams();

  return (
    <Box sx={{ p: 5 }}>
      <Typography variant="h4">📄 평가 템플릿 상세 페이지</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        템플릿 ID: <strong>{id}</strong>
      </Typography>
    </Box>
  );
}
