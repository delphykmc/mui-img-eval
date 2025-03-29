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
import InputLabel from '@mui/material/InputLabel';

import { DashboardContent } from 'src/layouts/dashboard';

const API_URL = import.meta.env.VITE_API_URL;

export function EvalCompareView() {
  const { id: templateId } = useParams();
  const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [threshold, setThreshold] = useState(20);
  const [flip, setFlip] = useState(false);

  const [zoomLevels, setZoomLevels] = useState<number[]>([0.25, 0.5, 0.75, 1.0, 2.0, 4.0]);
  const [zoomIndex, setZoomIndex] = useState(3); // 1.0
  const zoomLevel = zoomLevels[zoomIndex] || 1.0;

  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const canvasDiffRef = useRef<HTMLCanvasElement>(null);

  const aImage = useRef<HTMLImageElement | null>(null);
  const bImage = useRef<HTMLImageElement | null>(null);
  const diffImage = useRef<HTMLImageElement | null>(null);

  const selected = imagePairs[selectedIndex];

  const loadImage = useCallback((url: string, ref: React.MutableRefObject<HTMLImageElement | null>, callback: () => void) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      ref.current = img;
      callback();
    };
  }, []);

  const drawToCanvas = useCallback((ref: React.RefObject<HTMLCanvasElement>, imgRef: React.MutableRefObject<HTMLImageElement | null>) => {
    const canvas = ref.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = img.width * zoomLevel;
    const height = img.height * zoomLevel;

    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }, [zoomLevel]);

  const renderAll = useCallback(() => {
    if (!selected) return;
    drawToCanvas(canvasARef, flip ? bImage : aImage);
    drawToCanvas(canvasBRef, flip ? aImage : bImage);
    drawToCanvas(canvasDiffRef, diffImage);
  }, [selected, flip, drawToCanvas]);

  useEffect(() => {
    if (!selected) return;
    const aUrl = `${API_URL}/static/sample/${selected.a}`;
    const bUrl = `${API_URL}/static/sample/${selected.b}`;
    const diffUrl = `${API_URL}/diff_image?img1=${selected.a}&img2=${selected.b}&threshold=${threshold}`;

    loadImage(aUrl, aImage, renderAll);
    loadImage(bUrl, bImage, renderAll);
    loadImage(diffUrl, diffImage, renderAll);
  }, [selected, threshold, loadImage, renderAll]);

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
        setZoomLevels(data.zoom_levels || zoomLevels);
      } catch (err) {
        console.error("❌ Failed to fetch zoom levels", err);
      }
    };
    fetchZoomLevels();
  }, [zoomLevels]);

  useEffect(() => {
    renderAll();
  }, [zoomLevel, flip, renderAll]);

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomIndex((prev) => {
      const delta = e.deltaY > 0 ? -1 : 1;
      const newIndex = Math.min(Math.max(prev + delta, 0), zoomLevels.length - 1);
      return newIndex;
    });
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Image Pair Comparison
      </Typography>

      <Box display="flex" gap={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }} variant="outlined">
          <InputLabel id="image-select-label">Images</InputLabel>
          <Select
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
          label="Tolerence"
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          sx={{ width: 120 }}
        />

        <FormControl sx={{ minWidth: 120 }} variant="outlined">
          <InputLabel id="zoom-level-label">Zoom</InputLabel>
          <Select
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
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? 'Image B' : 'Image A'}
            </Typography>
            <Box sx={{ overflow: 'hidden'}}>
              <canvas ref={canvasARef} onWheel={handleWheelZoom} style={{ border: '1px solid #ccc' }} />
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? 'Image A' : 'Image B'}
            </Typography>
            <Box sx={{ overflow: 'hidden'}}>
              <canvas ref={canvasBRef} onWheel={handleWheelZoom} style={{ border: '1px solid #ccc' }} />
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Difference
            </Typography>
            <Box sx={{ overflow: 'hidden'}}>
              <canvas ref={canvasDiffRef} onWheel={handleWheelZoom} style={{ border: '1px solid #ccc' }} />
            </Box>
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
