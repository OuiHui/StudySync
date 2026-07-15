import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';

interface FileViewerProps {
  fileUrl: string;
  title: string;
  height?: string;
}

export const FileViewer = ({ fileUrl, title, height = '600px' }: FileViewerProps) => {
  const { resolvedUrl, loading } = useResolvedFileUrl(fileUrl);
  
  const displayUrl = resolvedUrl || fileUrl;
  const isPdf = displayUrl.toLowerCase().split('?')[0].endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayUrl.split('?')[0]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-900/40 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading secure material...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800">
      {isPdf ? (
        <div className="flex flex-col">
          <div className="p-3 border-b bg-gray-100/50 dark:bg-gray-800/50 flex justify-between items-center text-xs border-gray-200 dark:border-gray-700">
            <span className="font-medium truncate text-gray-700 dark:text-gray-300 max-w-[70%]">
              📄 {title || 'Attached PDF Document'}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(displayUrl, '_blank')}
              className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ExternalLink size={12} className="mr-1" /> Open in New Tab
            </Button>
          </div>
          <iframe src={displayUrl} style={{ height }} className="w-full border-0" title={title} />
        </div>
      ) : isImage ? (
        <div className="p-4 flex flex-col items-center">
          <img src={displayUrl} className="max-w-full h-auto max-h-[550px] rounded border dark:border-gray-800" alt={title} />
          <div className="mt-3 w-full flex justify-between items-center text-xs">
            <span className="font-medium truncate text-gray-700 dark:text-gray-300">
              📷 {title || 'Attached Image'}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(displayUrl, '_blank')}
              className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ExternalLink size={12} className="mr-1" /> View Full Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/10">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Preview not available for this file type.</p>
          <Button onClick={() => window.open(displayUrl, '_blank')} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Download className="w-4 h-4 mr-2" /> Download Document
          </Button>
        </div>
      )}
    </div>
  );
};
