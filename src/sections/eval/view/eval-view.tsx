import { useState, useCallback } from 'react';
import { useFetchTemplates } from 'src/hooks/useFetchTemplates';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';

import { _posts } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { PostItem } from '../post-item';
import { PostSort } from '../post-sort';
import { PostSearch } from '../post-search';

// ----------------------------------------------------------------------
const API_URL = import.meta.env.VITE_API_URL;

export function EvalView() {
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState(''); // ✅ 검색 상태 추가
  const [currentPage, setCurrentPage] = useState(1); // ✅ 현재 페이지 상태 추가
  const itemsPerPage = 7; // ✅ 한 페이지에 표시할 항목 수
  const { templates, loading, error } = useFetchTemplates(); // ✅ 커스텀 훅 사용

  const handleSort = useCallback((newSort: string) => {
    setSortBy(newSort);
  }, []);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error}</Typography>;

  // ✅ 검색 기능: title 또는 description에 검색어가 포함된 항목 필터링
  const filteredTemplates = templates.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ 정렬 로직 추가
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime(); // 최신순 (내림차순)
    }
    if (sortBy === 'oldest') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); // 오래된순 (오름차순)
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title); // 타이틀 정렬 (알파벳 오름차순)
    }
    return 0;
  });

  // ✅ 페이지네이션 적용
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage); // 전체 페이지 수 계산
  const paginatedTemplates = sortedTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (_event: any, page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Evaluation
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New template
        </Button>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <PostSearch posts={templates} onSearch={setSearchQuery} />
        <PostSort
          sortBy={sortBy}
          onSort={handleSort}
          options={[
            { value: 'latest', label: 'Latest' },
            { value: 'title', label: 'Title' },
            { value: 'oldest', label: 'Oldest' },
          ]}
        />
      </Box>

      <Grid container spacing={3}>
        {paginatedTemplates.map((post, index) => {
          const latestPostLarge = index === 0;
          const latestPost = index === 1 || index === 2;

          return (
            <Grid key={post.id} xs={12} sm={latestPostLarge ? 12 : 6} md={latestPostLarge ? 6 : 3}>
              <PostItem post={post} latestPost={latestPost} latestPostLarge={latestPostLarge} />
            </Grid>
          );
        })}
      </Grid>

      {/* ✅ 전체 페이지 수가 1보다 클 때만 페이지네이션 표시 */}
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={totalPages > 0 ? currentPage : 1} // ✅ totalPages가 0이면 기본값 1 설정
          onChange={handlePageChange}
          color="primary"
          sx={{ mt: 8, mx: 'auto' }}
        />
      )}

    </DashboardContent>
  );
}
