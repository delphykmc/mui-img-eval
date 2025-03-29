// src/sections/eval/view/eval-compare-view.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { DashboardContent } from 'src/layouts/dashboard';

const API_URL = import.meta.env.VITE_API_URL;

export function EvalCompareView() {
  const { id: templateId } = useParams(); // templateId from URL
  const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [threshold, setThreshold] = useState(20);
  const [flip, setFlip] = useState(false); // 좌우 뒤집기
  const [zoomLevel, setZoomLevel] = useState(1);

  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const canvasDiffRef = useRef<HTMLCanvasElement>(null);

  const selected = imagePairs[selectedIndex];
  const aUrl = selected ? `${API_URL}/static/sample/${selected.a}` : '';
  const bUrl = selected ? `${API_URL}/static/sample/${selected.b}` : '';
  const diffUrl = selected
    ? `${API_URL}/diff_image?img1=${selected.a}&img2=${selected.b}&threshold=${threshold}`
    : '';

  // Load image into canvas
  const drawImageToCanvas = useCallback(
    (url: string, canvasRef: React.RefObject<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = url;
      img.onload = () => {
        const width = img.width * zoomLevel;
        const height = img.height * zoomLevel;

        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingEnabled = false; // ✅ Nearest neighbor
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
    },
    [zoomLevel]
  );

  useEffect(() => {
    if (!selected) return;
    drawImageToCanvas(flip ? bUrl : aUrl, canvasARef);
    drawImageToCanvas(flip ? aUrl : bUrl, canvasBRef);
    drawImageToCanvas(diffUrl, canvasDiffRef);
  }, [selected, drawImageToCanvas, flip, diffUrl, aUrl, bUrl]);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const res = await fetch(`${API_URL}/get_image_pairs?template_id=${templateId}`);
        const data = await res.json();
        setImagePairs(data.image_pairs || []);
      } catch (err) {
        console.error("❌ Failed to fetch image pairs", err);
      }
    };

    fetchPairs();
  }, [templateId]);

  // 공통 zoom 핸들러
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Evaluation Compare View
      </Typography>

      {/* 상단 제어 UI */}
      <Box display="flex" gap={2} alignItems="center" sx={{ mb: 3 }}>
        {/* Combo Box */}
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          >
            {imagePairs.map((pair, index) => (
              <MenuItem key={index} value={index}>
                {pair.a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Threshold 입력 */}
        <TextField
          label="Threshold"
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          sx={{ width: 120 }}
        />

        {/* Flip 좌우 전환 */}
        <IconButton onClick={() => setFlip(!flip)}>
          <SwapHorizIcon />
        </IconButton>
      </Box>

      {/* 이미지 비교 Grid */}
      {selected && (
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? "Image B" : "Image A"}
            </Typography>
            <canvas ref={canvasARef} onWheel={handleWheelZoom} style={{ border: '1px solid #ccc' }} />
          </Grid>

          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? "Image A" : "Image B"}
            </Typography>
            <canvas ref={canvasBRef} onWheel={handleWheelZoom} style={{ border: '1px solid #ccc' }} />
          </Grid>

          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Diff
            </Typography>
            <canvas ref={canvasDiffRef} onWheel={handleWheelZoom} style={{ border: '1px solid #ccc' }} />
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
