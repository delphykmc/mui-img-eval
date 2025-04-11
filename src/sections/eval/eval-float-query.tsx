import {
  Box,
  Typography,
  Paper,
  Slider,
  Stack,
  Button,
  useTheme,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useEffect, useRef, useState } from 'react';
import { Theme } from '@mui/material/styles';

const scoreEmojis = ['😐', '🙂', '😄'];

const getMarks = (
  steps: number,
  current: number,
  theme: Theme
) => {
  const half = Math.floor(steps / 2);
  return Array.from({ length: steps }, (_, i) => {
    const value = i - half;
    const abs = Math.abs(value);
    const label = scoreEmojis[abs];
    const isActive = value === current;

    return {
      value,
      label: (
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: isActive ? 700 : 400,
            color: isActive
              ? theme.palette.mode === 'dark'
                ? '#fff'
                : 'rgba(0,0,0,0.87)'
              : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(0,0,0,0.4)',
          }}
        >
          {label}
        </Typography>
      ),
    };
  });
};

interface EvalFloatingPanelProps {
  visible: boolean;
  imageId: string;
  queryList: { id: string; label: string; step: number }[];
  values: Record<string, number>;
  onChange: (queryId: string, value: number) => void;
  onSave: () => void;
}

export function EvalFloatingPanel({
  visible,
  imageId,
  queryList,
  values,
  onChange,
  onSave,
}: EvalFloatingPanelProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isHover, setIsHover] = useState(false);
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

  if (!visible) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 3000,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        p: 2,
        width: 'auto',
        minWidth: 400,
        maxWidth: 800,
        userSelect: 'none',
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        sx={{
          cursor: dragging.current ? 'grabbing' : isHover ? 'grab' : 'default',
          mb: 2,
        }}
      >
        <Box display="flex" alignItems="center">
          <DragIndicatorIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="subtitle1">Query</Typography>
        </Box>

        <Button size="small" onClick={onSave} variant="contained"
          sx={{
            backgroundColor: 'rgba(0,0,0,0.75)',
            color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.9)',
            },
          }}
        >
          Save
        </Button>
      </Box>

      <Stack spacing={3}>
        {queryList.map((q) => {
          const half = Math.floor(q.step / 2);
          const current = values[q.id] ?? undefined;

          return (
            <Box key={q.id} sx={{ px: 2 }}>
              <Box display="flex" alignItems="center" mb={1} gap={1}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: current !== undefined ? 'success.main' : 'grey.400',
                  }}
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  {q.label}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1} px={1}>
                <Typography
                  sx={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    minWidth: 30,
                    textAlign: 'center',
                    color: 'text.primary',
                    transform: 'translateY(-10px)',
                  }}
                >
                  A
                </Typography>

                <Slider
                  value={current ?? 0}
                  onChange={(e, val) => onChange(q.id, val as number)}
                  step={1}
                  min={-half}
                  max={half}
                  marks={getMarks(q.step, current ?? 0, theme)}
                  sx={{
                    flex: 1,
                    color: 'rgba(0,0,0,0.87)',
                    mt: 1, // 슬라이더와 마크 간 보정
                    '& .MuiSlider-track': { border: 'none' },
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
                      fontSize: '0.85rem'
                    },
                  }}
                />

                <Typography
                  sx={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    minWidth: 30,
                    textAlign: 'center',
                    color: 'text.primary',
                    transform: 'translateY(-10px)',
                  }}
                >
                  B
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
