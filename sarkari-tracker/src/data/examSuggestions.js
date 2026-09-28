import examList from './examRegistry.json';

// Helper to normalize and ensure each exam has an id, searchable text, and slug
export const EXAM_SUGGESTIONS = examList.map((exam, index) => {
  const id = exam.id || index + 1;
  const name = exam.name || '';
  const short_name = exam.short_name || exam.name || '';
  const conducting_body = exam.conducting_body || 'Official Government Commission';
  const category = exam.category || 'Central';
  const state = exam.state || (category.toLowerCase().includes('karnataka') ? 'Karnataka' : null);
  const official_site = exam.official_site || exam.careers_url || '';

  return {
    ...exam,
    id,
    name,
    short_name,
    conducting_body,
    category,
    state,
    official_site,
    searchableText: `${name} ${short_name} ${conducting_body} ${category} ${state || ''}`.toLowerCase()
  };
});

export default EXAM_SUGGESTIONS;
