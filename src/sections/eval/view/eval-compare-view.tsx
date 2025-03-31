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
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { DashboardContent } from 'src/layouts/dashboard';

const API_URL = import.meta.env.VITE_API_URL;

export function EvalCompareView() {
  const { id: templateId } = useParams();
  const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [threshold, setThreshold] = useState(20);
  const [flip, setFlip] = useState(false);
  const [zoomLevels, setZoomLevels] = useState<number[]>([0.25, 0.5, 0.75, 1.0, 2.0, 4.0]);
  const [zoomIndex, setZoomIndex] = useState(3);
  const zoomLevel = zoomLevels[zoomIndex] || 1.0;

  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const canvasDiffRef = useRef<HTMLCanvasElement>(null);

  const aImage = useRef<HTMLImageElement | null>(null);
  const bImage = useRef<HTMLImageElement | null>(null);
  const diffImage = useRef<HTMLImageElement | null>(null);

  const selected = imagePairs[selectedIndex];

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startPoint = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startPoint.current.x;
    const dy = e.clientY - startPoint.current.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    startPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setDragging(false);
  const handleMouseLeave = () => setDragging(false);

  const loadImage = useCallback((url: string, ref: React.MutableRefObject<HTMLImageElement | null>, onLoad: () => void) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      ref.current = img;
      onLoad();
    };
  }, []);

  const drawToCanvas = useCallback(
    (ref: React.RefObject<HTMLCanvasElement>, imgRef: React.MutableRefObject<HTMLImageElement | null>) => {
      const canvas = ref.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      requestAnimationFrame(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = img.width * zoomLevel;
        const height = img.height * zoomLevel;

        const parent = canvas.parentElement;
        if (!parent) return;

        const maxOffsetX = 0;
        const minOffsetX = parent.clientWidth - width;
        const maxOffsetY = 0;
        const minOffsetY = parent.clientHeight - height;

        const clampedX = Math.min(Math.max(offset.x, minOffsetX), maxOffsetX);
        const clampedY = Math.min(Math.max(offset.y, minOffsetY), maxOffsetY);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, clampedX, clampedY, width, height);
      });
    },
    [zoomLevel, offset]
  );

  const renderAll = useCallback(() => {
    drawToCanvas(canvasARef, flip ? bImage : aImage);
    drawToCanvas(canvasBRef, flip ? aImage : bImage);
    drawToCanvas(canvasDiffRef, diffImage);
  }, [flip, drawToCanvas]);

  const loadedCount = useRef(0);

  const tryRenderAll = useCallback(() => {
    loadedCount.current += 1;
    if (loadedCount.current === 3) {
      renderAll();
      loadedCount.current = 0;
    }
  }, [renderAll]);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [selected]);

  useEffect(() => {
    if (!selected) return;

    const aUrl = `${API_URL}/static/sample/${selected.a}`;
    const bUrl = `${API_URL}/static/sample/${selected.b}`;
    const diffUrl = `${API_URL}/diff_image?img1=${selected.a}&img2=${selected.b}&threshold=${threshold}`;

    loadedCount.current = 0;
    loadImage(aUrl, aImage, tryRenderAll);
    loadImage(bUrl, bImage, tryRenderAll);
    loadImage(diffUrl, diffImage, tryRenderAll);
  }, [selected, threshold, loadImage, tryRenderAll]);

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

  useEffect(() => {
    const fetchZoomLevels = async () => {
      try {
        const res = await fetch(`${API_URL}/zoom_levels`);
        const data = await res.json();
        setZoomLevels(() => data.zoom_levels || [0.25, 0.5, 0.75, 1.0, 2.0, 4.0]);
      } catch (err) {
        console.error("❌ Failed to fetch zoom levels", err);
      }
    };
    fetchZoomLevels();
  }, []);

  useEffect(() => {
    renderAll();
  }, [zoomLevel, flip, offset, renderAll]);

  useEffect(() => {
    const canvases = [canvasARef.current, canvasBRef.current, canvasDiffRef.current];
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomIndex((prev) => {
        const delta = e.deltaY > 0 ? -1 : 1;
        const newIndex = Math.min(Math.max(prev + delta, 0), zoomLevels.length - 1);
        return newIndex;
      });
    };

    canvases.forEach((canvas) => {
      if (canvas) canvas.addEventListener('wheel', handleWheel, { passive: false });
    });
    return () => {
      canvases.forEach((canvas) => {
        if (canvas) canvas.removeEventListener('wheel', handleWheel);
      });
    };
  }, [zoomLevels]);

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Evaluation Compare View
      </Typography>

      <Box display="flex" gap={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }} variant="outlined">
          <InputLabel id="image-select-label">Images</InputLabel>
          <Select
            labelId="image-select-label"
            value={selectedIndex}
            label="Images"
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          >
            {imagePairs.map((pair, index) => (
              <MenuItem key={index} value={index}>
                {pair.a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Threshold"
          type="number"
          value={threshold}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (!Number.isNaN(val) && val >= 0 && val <= 255) {
              setThreshold(val);
            }
          }}
          sx={{ width: 120 }}
          inputProps={{ min: 0, max: 255 }}
        />

        <FormControl sx={{ minWidth: 120 }} variant="outlined">
          <InputLabel id="zoom-select-label">Zoom</InputLabel>
          <Select
            labelId="zoom-select-label"
            value={zoomIndex}
            label="Zoom"
            onChange={(e) => setZoomIndex(Number(e.target.value))}
          >
            {zoomLevels.map((level, index) => (
              <MenuItem key={index} value={index}>
                {Math.round(level * 100)}%
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton onClick={() => setFlip(!flip)}>
          <SwapHorizIcon />
        </IconButton>
      </Box>

      {selected && (
        <Grid container spacing={2}>
          {[canvasARef, canvasBRef, canvasDiffRef].map((ref, i) => (
            <Grid
              key={i}
              item
              xs={4}
              sx={{
                maxHeight: '600px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '600px',
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {i === 0 ? (flip ? 'Image B' : 'Image A') : i === 1 ? (flip ? 'Image A' : 'Image B') : 'Diff'}
              </Typography>
              <Box
                sx={{ overflow: 'hidden', height: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <canvas
                  ref={ref}
                  style={{ border: '1px solid #ccc', cursor: dragging ? 'grabbing' : 'grab' }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardContent>
  );
}
