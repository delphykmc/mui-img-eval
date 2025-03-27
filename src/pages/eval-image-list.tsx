// src/pages/eval-image-list.tsx
import { Helmet } from 'react-helmet-async';
import EvalImageGrid from 'src/sections/eval/view/eval-image-grid';

export default function EvalImageListPage() {
  return (
    <>
      <Helmet>
        <title> Eval Images | MUI Image Eval </title>
      </Helmet>

      <EvalImageGrid />
    </>
  );
}
