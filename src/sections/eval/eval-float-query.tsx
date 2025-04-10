import {
  Box,
  Typography,
  Paper,
  Slider,
  Stack,
  useTheme,
} from '@mui/material';
import { useTheme, Theme } from '@mui/material/styles';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useEffect, useRef, useState } from 'react';

const queryList = [
  { id: 'sharpness', label: 'Sharpness', step: 5 },
  { id: 'contrast', label: 'Contrast', step: 5 },
  { id: 'noise', label: 'Noise', step: 3 },
];

const getMarks = (
  steps: number,
  current: number,
  theme: Theme,
) => {
  const half = Math.floor(steps / 2);
  return Array.from({ length: steps }, (_, i) => {
    const value = i - half;
    const isActive = value === current;
    return {
      value,
      label: (
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive
              ? theme.palette.mode === 'dark'
                ? '#fff'
                : 'rgba(0,0,0,0.87)'
              : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(0,0,0,0.4)',
          }}
        >
          {value === 0 ? 'EVEN' : value < 0 ? `A +${-value}` : `B +${value}`}
        </Typography>
      ),
    };
  });
};

export function EvalFloatingPanel({ visible }: { visible: boolean }) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isHover, setIsHover] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const theme = useTheme();

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;
      requestAnimationFrame(() => {
        setPosition({ x: newX, y: newY });
      });
    };

    const stopDrag = () => {
      dragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);
    window.addEventListener('blur', stopDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('mouseleave', stopDrag);
      window.removeEventListener('blur', stopDrag);
    };
  }, []);

  const handleChange = (id: string, val: number | number[]) => {
    setScores((prev) => ({ ...prev, [id]: val as number }));
  };

  if (!visible) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 3000,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        borderRadius: 2,
        p: 2,
        width: 'auto',
        minWidth: 280,
        maxWidth: 360,
        userSelect: 'none',
      }}
    >
      <Box
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: dragging.current
            ? 'grabbing'
            : isHover
            ? 'grab'
            : 'default',
          mb: 2,
        }}
      >
        <DragIndicatorIcon fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="subtitle1">평가 항목</Typography>
      </Box>

      <Stack spacing={3}>
        {queryList.map((q) => {
          const half = Math.floor(q.step / 2);
          const currentValue = scores[q.id] ?? 0;

          return (
            <Box key={q.id} sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                {q.label}
              </Typography>
              <Slider
                value={currentValue}
                onChange={(e, val) => handleChange(q.id, val)}
                step={1}
                min={-half}
                max={half}
                marks={getMarks(q.step, currentValue, theme)}
                sx={{
                  color: 'rgba(0,0,0,0.87)',
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 24,
                    height: 24,
                    backgroundColor: '#fff',
                    '&::before': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                    },
                    '&:hover, &.Mui-focusVisible, &.Mui-active': {
                      boxShadow: 'none',
                    },
                  },
                  '& .MuiSlider-markLabel': {
                    mt: 2,
                  },
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
