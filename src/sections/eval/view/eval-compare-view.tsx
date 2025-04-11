import { useEffect, useState, useRef, useCallback } from 'react';
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
import AssessmentIcon from '@mui/icons-material/Assessment';

import { DashboardContent } from 'src/layouts/dashboard';
import { CompareCanvas } from 'src/layouts/components/compare-canvas';
import { DiffCanvas } from 'src/layouts/components/diff-canvas';
import { EvalFloatingPanel } from 'src/sections/eval/eval-float-query';

const API_URL = import.meta.env.VITE_API_URL;

const canvasGridStyle = {
  maxHeight: '800px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '800px',
};

export function EvalCompareView() {
  const { id: templateId } = useParams();
  const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [threshold, setThreshold] = useState(20);
  const [flip, setFlip] = useState(false);
  const [zoomLevels, setZoomLevels] = useState<number[]>([0.25, 0.5, 0.75, 1.0, 2.0, 4.0]);
  const [zoomIndex, setZoomIndex] = useState(3);
  const zoomLevel = zoomLevels[zoomIndex] || 1.0;

  const [aImage, setAImage] = useState<HTMLImageElement | null>(null);
  const [bImage, setBImage] = useState<HTMLImageElement | null>(null);
  const [diffImage, setDiffImage] = useState<HTMLImageElement | null>(null);

  const selected = imagePairs[selectedIndex];

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startPoint = useRef({ x: 0, y: 0 });

  const [showPanel, setShowPanel] = useState(false);
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({});

  const queryList = [
    { id: 'sharpness', label: 'Sharpness', step: 5 },
    { id: 'contrast', label: 'Contrast', step: 5 },
    { id: 'noise', label: 'Noise', step: 3 },
  ];

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

  const loadImage = useCallback((url: string, setter: (img: HTMLImageElement) => void) => {
    const img = new Image();
    img.onload = () => setter(img);
    img.src = url;
  }, []);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [selected]);

  useEffect(() => {
    if (!selected) return;

    const aUrl = `${API_URL}/static/sample/${selected.a}`;
    const bUrl = `${API_URL}/static/sample/${selected.b}`;
    const diffUrl = `${API_URL}/diff_image?img1=${selected.a}&img2=${selected.b}&threshold=${threshold}`;

    loadImage(aUrl, setAImage);
    loadImage(bUrl, setBImage);
    loadImage(diffUrl, setDiffImage);
  }, [selected, threshold, loadImage]);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const res = await fetch(`${API_URL}/get_image_pairs?template_id=${templateId}`);
        const data = await res.json();
        setImagePairs(data.image_pairs || []);
      } catch (err) {
        console.error('❌ Failed to fetch image pairs', err);
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
        console.error('❌ Failed to fetch zoom levels', err);
      }
    };
    fetchZoomLevels();
  }, []);

  useEffect(() => {
    const canvases = document.querySelectorAll('canvas');
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomIndex((prev) => {
        const delta = e.deltaY > 0 ? -1 : 1;
        return Math.min(Math.max(prev + delta, 0), zoomLevels.length - 1);
      });
    };
    canvases.forEach((canvas) => {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    });
    return () => {
      canvases.forEach((canvas) => {
        canvas.removeEventListener('wheel', handleWheel);
      });
    };
  }, [zoomLevels]);

  const handleScoreChange = (queryId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [selectedIndex]: {
        ...prev[selectedIndex],
        [queryId]: value,
      },
    }));
  };

  const handleSave = () => {
    const scoreData = scores[selectedIndex];
    const pair = imagePairs[selectedIndex];
    console.log(`[SAVE] index ${selectedIndex}`, { pair, scores: scoreData });
  };

  const currentScores = scores[selectedIndex] ?? {};

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

        <IconButton
          onClick={() => setShowPanel((prev) => !prev)}
          sx={{
            backgroundColor: showPanel ? 'rgba(0,0,0,0.08)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.12)' },
          }}
        >
          <AssessmentIcon
            sx={{
              color: showPanel ? 'rgba(33,33,33,0.87)' : 'rgba(0,0,0,0.4)',
              transition: 'color 0.2s',
            }}
          />
        </IconButton>
      </Box>

      {selected && (
        <Grid container spacing={2}>
          {/* A 영상 */}
          <Grid item xs={4} sx={canvasGridStyle}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? 'Image B' : 'Image A'}
            </Typography>
            <Box sx={{
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              p: 1,
              }}
            >
              <CompareCanvas
                image={flip ? bImage : aImage}
                zoomLevel={zoomLevel}
                offset={offset}
                dragging={dragging}
                onDragStart={handleMouseDown}
                onDragMove={handleMouseMove}
                onDragEnd={handleMouseUp}
              />
            </Box>
          </Grid>

          {/* B 영상 */}
          <Grid item xs={4} sx={canvasGridStyle}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? 'Image A' : 'Image B'}
            </Typography>
            <Box sx={{
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              p: 1,
              }}
            >
              <CompareCanvas
                image={flip ? aImage : bImage}
                zoomLevel={zoomLevel}
                offset={offset}
                dragging={dragging}
                onDragStart={handleMouseDown}
                onDragMove={handleMouseMove}
                onDragEnd={handleMouseUp}
              />
            </Box>
          </Grid>

          {/* Diff 영상 */}
          <Grid item xs={4} sx={canvasGridStyle}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Diff
            </Typography>
            <Box sx={{
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              p: 1,
              }}
            >              
              <DiffCanvas
                image={diffImage}
                zoomLevel={zoomLevel}
                offset={offset}
                threshold={threshold}
                dragging={dragging}
                onDragStart={handleMouseDown}
                onDragMove={handleMouseMove}
                onDragEnd={handleMouseUp}
              />
            </Box>
          </Grid>
        </Grid>
      )}

      <EvalFloatingPanel
        visible={showPanel}
        imageId={`pair-${selectedIndex}`}
        queryList={queryList}
        values={currentScores}
        onChange={handleScoreChange}
        onSave={handleSave}
      />
    </DashboardContent>
  );
}
