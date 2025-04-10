// src/sections/eval/eval-query.tsx
import {
  Popover,
  IconButton,
  Box,
  Typography,
  Slider,
  Stack,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useState } from 'react';

const queryList = [
  { id: 'sharpness', label: 'Sharpness' },
  { id: 'contrast', label: 'Contrast' },
  { id: 'noise', label: 'Noise' },
];

export function EvalQueryPopup({
  anchorEl,
  onClose,
  open,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleChange = (id: string, val: number | number[]) => {
    setScores((prev) => ({ ...prev, [id]: val as number }));
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { p: 2, width: 260 } }}
    >
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        평가 항목
      </Typography>
      <Stack spacing={2}>
        {queryList.map((q) => (
          <Box key={q.id}>
            <Typography variant="body2" gutterBottom>
              {q.label}
            </Typography>
            <Slider
              value={scores[q.id] ?? 50}
              onChange={(e, val) => handleChange(q.id, val)}
              min={0}
              max={100}
            />
          </Box>
        ))}
      </Stack>
    </Popover>
  );
}
