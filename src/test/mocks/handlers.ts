import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase REST endpoints (/rest/v1/*)
  http.get('*/rest/v1/profiles*', () => {
    return HttpResponse.json([
      {
        id: 'u1',
        user_id: 'test-user-id',
        display_name: 'Sarah Chen',
        email: 'sarah.chen@gatech.edu',
        avatar_url: null,
      },
    ]);
  }),

  http.get('*/rest/v1/study_sessions*', () => {
    return HttpResponse.json([
      {
        id: 'test-session-id',
        title: 'ML Sync Session',
        subject: 'Computer Science',
        created_by: 'test-user-id',
        status: 'active',
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 3600000).toISOString(),
        max_participants: 20,
        is_public: true,
      },
    ]);
  }),

  http.get('*/rest/v1/study_groups*', () => {
    return HttpResponse.json([
      {
        id: 'test-group-id',
        name: 'CS 2110 Study Group',
        subject: 'Computer Science',
        description: 'Systems & Architecture',
        is_public: true,
        created_by: 'test-user-id',
      },
    ]);
  }),

  http.get('*/rest/v1/notes*', () => {
    return HttpResponse.json([
      {
        id: 'test-note-id',
        title: 'Calculus Notes',
        content: '# Integration Techniques\n\n- Integration by parts',
        subject: 'Mathematics',
        created_by: 'test-user-id',
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Generic fallback for any other Supabase REST API requests
  http.post('*/rest/v1/*', () => {
    return HttpResponse.json({ success: true });
  }),
  http.patch('*/rest/v1/*', () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete('*/rest/v1/*', () => {
    return HttpResponse.json({ success: true });
  }),
];
