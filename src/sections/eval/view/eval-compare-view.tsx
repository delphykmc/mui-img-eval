import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { DashboardContent } from 'src/layouts/dashboard';

const API_URL = import.meta.env.VITE_API_URL;

export function EvalCompareView() {
  const { id: templateId } = useParams();
  const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tolerance, setTolerance] = useState(20); // ✅ tolerance state
  const [swap, setSwap] = useState(false); // ✅ swap toggle

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

  const selected = imagePairs[selectedIndex];
  const aUrl = selected ? `${API_URL}/static/sample/${selected.a}` : '';
  const bUrl = selected ? `${API_URL}/static/sample/${selected.b}` : '';
  const diffUrl = selected
    ? `${API_URL}/diff_image?img1=${selected.a}&img2=${selected.b}&threshold=${tolerance}`
    : '';

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Evaluation Compare View
      </Typography>

      {/* ✅ Controls */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={imagePairs.length > 0 ? selectedIndex : ''}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            displayEmpty
          >
            {imagePairs.length === 0 ? (
              <MenuItem value="">No image pairs</MenuItem>
            ) : (
              imagePairs.map((pair, index) => (
                <MenuItem key={index} value={index}>
                  {pair.a}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* ✅ Tolerance 입력창 */}
        <TextField
          label="Tolerance"
          type="number"
          value={tolerance}
          onChange={(e) => setTolerance(Number(e.target.value))}
          inputProps={{ min: 0, max: 255 }}
          sx={{ width: 120 }}
        />

        {/* ✅ Swap 버튼 */}
        <Button variant="outlined" size="large" onClick={() => setSwap(!swap)}>
          Swap Left/Right
        </Button>
      </Stack>

      {/* ✅ 이미지 비교 표시 */}
      {selected && (
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="subtitle1">
              {swap ? 'Image B' : 'Image A'}
            </Typography>
            <img src={swap ? bUrl : aUrl} alt="Left" width="100%" />
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1">Diff</Typography>
            <img src={diffUrl} alt="Visual difference" width="100%" />
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1">
              {swap ? 'Image A' : 'Image B'}
            </Typography>
            <img src={swap ? aUrl : bUrl} alt="Right" width="100%" />
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}

// // src/sections/eval/view/eval-compare-view.tsx
// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';

// import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid';
// import Typography from '@mui/material/Typography';
// import MenuItem from '@mui/material/MenuItem';
// import FormControl from '@mui/material/FormControl';
// import Select from '@mui/material/Select';

// import { DashboardContent } from 'src/layouts/dashboard';

// const API_URL = import.meta.env.VITE_API_URL;

// export function EvalCompareView() {
//   const { id: templateId } = useParams(); // templateId from URL
//   const [imagePairs, setImagePairs] = useState<{ a: string; b: string }[]>([]);
//   const [selectedIndex, setSelectedIndex] = useState(0);

//   useEffect(() => {
//     const fetchPairs = async () => {
//       try {
//         const res = await fetch(`${API_URL}/get_image_pairs?template_id=${templateId}`);
//         const data = await res.json();
//         setImagePairs(data.image_pairs || []);
//       } catch (err) {
//         console.error("❌ Failed to fetch image pairs", err);
//       }
//     };

//     fetchPairs();
//   }, [templateId]);

//   const selected = imagePairs[selectedIndex];
//   const aUrl = selected ? `${API_URL}/static/sample/${selected.a}` : '';
//   const bUrl = selected ? `${API_URL}/static/sample/${selected.b}` : '';
//   const diffUrl = selected
//     ? `${API_URL}/diff_image?img1=${selected.a}&img2=${selected.b}&threshold=20`
//     : '';

//   return (
//     <DashboardContent>
//       <Typography variant="h4" sx={{ mb: 2 }}>
//         Evaluation Compare View
//       </Typography>

//       {/* Combo Box */}
//       <FormControl fullWidth sx={{ maxWidth: 300, mb: 3 }}>
//         <Select
//           value={imagePairs.length > 0 ? selectedIndex : ''}
//           onChange={(e) => setSelectedIndex(Number(e.target.value))}
//           displayEmpty
//         >
//           {imagePairs.length === 0 ? (
//           <MenuItem value="">No image pairs</MenuItem>
//           ) : (
//           imagePairs.map((pair, index) => (
//               <MenuItem key={index} value={index}>
//               {pair.a}
//              </MenuItem>
//           ))
//           )}
//         </Select>
//       </FormControl>

//       {/* Image Compare Grid */}
//       {selected && (
//         <Grid container spacing={2}>
//           <Grid item xs={4}>
//             <Typography variant="subtitle1">Image A</Typography>
//             <img src={aUrl} alt="Original A version" width="100%" />
//           </Grid>
//           <Grid item xs={4}>
//             <Typography variant="subtitle1">Image B</Typography>
//             <img src={bUrl} alt="Modified B version" width="100%" />
//           </Grid>
//           <Grid item xs={4}>
//             <Typography variant="subtitle1">Diff</Typography>
//             <img src={diffUrl} alt="Visual difference between A and B" width="100%" />
//           </Grid>
//         </Grid>
//       )}
//     </DashboardContent>
//   );
// }
