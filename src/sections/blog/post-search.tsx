import { useState } from 'react';
import type { Theme, SxProps } from '@mui/material/styles';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';

import { Iconify } from 'src/components/iconify';

import type { PostItemProps } from './post-item';

// ----------------------------------------------------------------------

type PostSearchProps = {
  posts: PostItemProps[];
  onSearch: (query: string) => void;  // ✅ 검색어 변경을 부모로 전달
  sx?: SxProps<Theme>;
};

export function PostSearch({ posts, onSearch, sx }: PostSearchProps) {
  const [searchQuery, setSearchQuery] = useState(''); // ✅ 검색 상태 추가

  const handleInputChange = (_event: any, value: string) => {
    setSearchQuery(value);
    onSearch(value); // ✅ 부모 컴포넌트에 검색어 전달
  };

  const handleSelect = (_event: any, value: PostItemProps | null) => {
    if (value) {
      setSearchQuery(value.title); // ✅ 선택한 항목을 검색창에 반영
      onSearch(value.title); // ✅ 부모에게 전달하여 `filteredTemplates` 업데이트
    }
  };

  return (
    <Autocomplete
      sx={{ width: 320 }}
      autoHighlight
      popupIcon={null}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            [`& .${autocompleteClasses.option}`]: {
              typography: 'body2',
            },
            ...sx,
          },
        },
      }}
      options={posts}
      getOptionLabel={(post) => post.title}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onInputChange={handleInputChange} // ✅ 검색어 변경 이벤트 추가
      onChange={handleSelect} // ✅ 항목을 선택했을 때 호출
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search post..."
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Iconify
                  icon="eva:search-fill"
                  sx={{ ml: 1, width: 20, height: 20, color: 'text.disabled' }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}
