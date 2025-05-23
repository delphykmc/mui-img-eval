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
const USER_ID = 'unknown';

const canvasGridStyle = {
  maxHeight: '800px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '800px',
};

export function EvalCompareView() {
  const { id: templateId } = useParams();
  
  // --- Control panel ---
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [flip, setFlip] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // ---------------  Image event --------------- 
  const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
  const selected = imagePairs[selectedIndex]

  const [aImage, setAImage] = useState<HTMLImageElement | null>(null);
  const [bImage, setBImage] = useState<HTMLImageElement | null>(null);
  const [diffImage, setDiffImage] = useState<HTMLImageElement | null>(null);   

  const loadImage = useCallback((url: string, setter: (img: HTMLImageElement) => void) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setter(img);
    img.src = url;
  }, []);

  useEffect(() => {
    if (!selected || !templateId) return;

    const aUrl = `${API_URL}/get_image?template_id=${templateId}&filename=${selected.a}`;
    const bUrl = `${API_URL}/get_image?template_id=${templateId}&filename=${selected.b}`;
    const diffUrl = `${API_URL}/diff_image?template_id=${templateId}&img1=${selected.a}&img2=${selected.b}&threshold=${threshold}`;

    loadImage(aUrl, setAImage);
    loadImage(bUrl, setBImage);
    loadImage(diffUrl, setDiffImage);
  }, [selected, threshold, templateId, loadImage]);

  // ---------------  Mouse event --------------- 
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
  
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [selected]);

  // ---------------  Zoom event --------------- 
  const [zoomLevels, setZoomLevels] = useState([0.25, 0.5, 0.75, 1.0, 2.0, 4.0]);  
  const zoomLevel = zoomLevels[zoomIndex] || 1.0;

  useEffect(() => {
    const fetchZoomLevels = async () => {
      try {
        const res = await fetch(`${API_URL}/zoom_levels`);
        const data = await res.json();
        setZoomLevels(data.zoom_levels || [0.25, 0.5, 0.75, 1.0, 2.0, 4.0]);
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
    canvases.forEach((canvas) => canvas.addEventListener('wheel', handleWheel, { passive: false }));
    return () => canvases.forEach((canvas) => canvas.removeEventListener('wheel', handleWheel));
  }, [zoomLevels]);

  // --------------- Eval event --------------- 
  const [queryList, setQueryList] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({});  
  const currentScores = scores[selectedIndex] ?? {};

  const handleScoreChange = (queryId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [selectedIndex]: {
        ...prev[selectedIndex],
        [queryId]: value,
      },
    }));
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      const res = await fetch(`${API_URL}/eval_template_detail?template_id=${templateId}`);
      const data = await res.json();
      setImagePairs(data.image_pairs || []);
      setQueryList(data.query || []);
      
      const evalRes = await fetch(`${API_URL}/load_evaluation?template_id=${templateId}&user_id=${USER_ID}`);
      const evalData = await evalRes.json();

      if (evalData?.results) {
        const ok = window.confirm("이전에 평가한 내용이 있습니다. 불러올까요?");
        if (ok) {
          const loadedScores: Record<number, Record<string, number>> = {};
          (data.image_pairs || []).forEach((pair: { a: string; b: string }, idx: number) => {
            if (evalData.results[pair.a]) {
              loadedScores[idx] = evalData.results[pair.a];
            }
          });
          setScores(loadedScores);
        }
      };
    };
    if (templateId){
      fetchTemplate();
    }    
  }, [templateId]);
  
  const handleSave = async () => {
    const resultData: Record<string, Record<string, number>> = {};
    imagePairs.forEach((pair, idx) => {
      if (scores[idx]) {
        resultData[pair.a] = scores[idx];
      }
    });

    const payload = {
      template_id: templateId,
      user_id: USER_ID,
      created_at: new Date().toISOString(),
      results: resultData,
    };

    try {
      const res = await fetch(`${API_URL}/save_evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log('[SAVE SUCCESS]', json);
    } catch (err) {
      console.error('[SAVE ERROR]', err);
    }
  };  

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Evaluation Compare View
      </Typography>

      <Box display="flex" gap={2} alignItems="center" sx={{ mb: 3 }}>
        {imagePairs.length > 0 && (
          <FormControl sx={{ minWidth: 200 }}>
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
        )}

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

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="zoom-select-label">Zoom</InputLabel>
          <Select
            labelId="zoom-select-label"
            value={zoomIndex < zoomLevels.length ? zoomIndex : 0}
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
          <AssessmentIcon />
        </IconButton>
      </Box>

      {selected && (
        <Grid container spacing={2}>
          {/* A */}
          <Grid item xs={4} sx={canvasGridStyle}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? 'Image B' : 'Image A'}
            </Typography>
            <Box sx={{ overflow: 'hidden', height: '100%' }}>
              <CompareCanvas
                image={flip ? bImage : aImage}
                zoomLevel={zoomLevel}
                offset={offset}
                onDragStart={handleMouseDown}
                onDragMove={handleMouseMove}
                onDragEnd={handleMouseUp}
                dragging={dragging}
              />
            </Box>
          </Grid>

          {/* B */}
          <Grid item xs={4} sx={canvasGridStyle}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {flip ? 'Image A' : 'Image B'}
            </Typography>
            <Box sx={{ overflow: 'hidden', height: '100%' }}>
              <CompareCanvas
                image={flip ? aImage : bImage}
                zoomLevel={zoomLevel}
                offset={offset}
                onDragStart={handleMouseDown}
                onDragMove={handleMouseMove}
                onDragEnd={handleMouseUp}
                dragging={dragging}
              />
            </Box>
          </Grid>

          {/* Diff */}
          <Grid item xs={4} sx={canvasGridStyle}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Diff
            </Typography>
            <Box sx={{ overflow: 'hidden', height: '100%' }}>
              <DiffCanvas
                image={diffImage}
                zoomLevel={zoomLevel}
                offset={offset}
                threshold={threshold}
                onDragStart={handleMouseDown}
                onDragMove={handleMouseMove}
                onDragEnd={handleMouseUp}
                dragging={dragging}
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
