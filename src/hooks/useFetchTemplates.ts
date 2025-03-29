import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function useFetchTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log("✅ API_URL from env:", API_URL);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/list_templates`)
      .then(res => res.json())
      .then(data => {
        if (!data.templates) {
          console.error("❌ No templates found:", data);
          setError("No templates found");
          setLoading(false);
          return;
        }
        
        // JSON 파일별 평가 템플릿 데이터 로드
        const fetchTemplates = data.templates.map(async (filename: string) => {
          const response = await fetch(`${API_URL}/eval_templates/${filename}`);
          const templateArray = await response.json();
          const template = Array.isArray(templateArray) ? templateArray[0] : templateArray;

          return {
            id: template.template_id,
            title: template.template_name,
            description: template.description,
            coverUrl: template.coverUrl || "/assets/images/cover/default-cover.webp",
            createdAt: template.created_at,
            startDate: template.start_date || "N/A",
            endDate: template.end_date || "N/A",
            totalViews: 8829,
            totalComments: 7977,
            totalShares: 8556,
            author: {
              name: template.created_by ? template.created_by.split('@')[0] : "Unknown",
              avatarUrl: `/assets/images/avatar/avatar-${parseInt(template.template_id, 10)}.webp`,
            },
          };
        });

        // 모든 JSON 파일을 로드하고 상태 업데이트
        Promise.all(fetchTemplates).then((loadedTemplates: any[]) => {
          setTemplates(loadedTemplates);
          setLoading(false);
        });
      })
      .catch(err => {
        console.error("❌ Failed to load templates:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { templates, loading, error };
}
