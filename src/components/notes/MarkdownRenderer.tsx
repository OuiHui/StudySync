import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Parse markdown to HTML
  const rawHtml = React.useMemo(() => {
    if (!content) return '';
    try {
      // Configure marked to parse simple line breaks and allow raw HTML
      marked.setOptions({
        gfm: true,
        breaks: true
      });
      return marked.parse(content) as string;
    } catch (e) {
      console.error('Error parsing markdown:', e);
      return content;
    }
  }, [content]);

  // Sanitize HTML to prevent XSS while keeping safe interactive elements like details/summary and tables
  const sanitizedHtml = React.useMemo(() => {
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['details', 'summary', 'u', 'ins'],
      ADD_ATTR: ['open', 'class']
    });
  }, [rawHtml]);

  return (
    <div 
      className={`prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
