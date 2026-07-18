import TurndownService from 'turndown';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

turndownService.keep(['details', 'summary', 'u', 'ins', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br']);

export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  try {
    marked.setOptions({ gfm: true, breaks: true });
    const rawHtml = marked.parse(markdown) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['details', 'summary', 'u', 'ins'],
      ADD_ATTR: ['open', 'class'],
    });
  } catch (e) {
    console.error('Error compiling markdown to html:', e);
    return markdown;
  }
};

export const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  try {
    const cleanedHtml = html
      .replace(/<p><br><\/p>/g, '<br>')
      .replace(/<p>&nbsp;<\/p>/g, '<br>');
    return turndownService.turndown(cleanedHtml);
  } catch (e) {
    console.error('Error compiling html to markdown:', e);
    return html;
  }
};
