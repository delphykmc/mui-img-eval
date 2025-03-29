// src/sections/eval/view/eval-image-grid.tsx

import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Typography from '@mui/material/Typography';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardContent } from 'src/layouts/dashboard';

const DUMMY_IMAGE_COUNT = 24;

export function EvalImageGridView() {
  const navigate = useNavigate();
  const { id } = useParams(); // template ID 받기 (예: /eval/:id)

  const handleClick = (index: number) => {
    console.log(`📦 Clicked image ${index}`);
    navigate(`/eval/${id}/evaluate`, {
      state: { imageIndex: index },
    });
  };

  return (
    <DashboardContent>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Images in Template {id}
      </Typography>

      <ImageList variant="masonry" cols={4} gap={12}>
        {[...Array(DUMMY_IMAGE_COUNT)].map((_, index) => {
          const imageUrl = `/assets/images/temp/cover-${index + 1}.webp`;

          return (
            <ImageListItem
              key={index}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 3,
                },
              }}
              onClick={() => handleClick(index + 1)}
            >
              <img
                src={imageUrl}
                alt={`cover-${index + 1}`}
                loading="lazy"
                style={{
                  width: '100%',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </ImageListItem>
          );
        })}
      </ImageList>
    </DashboardContent>
  );
}
