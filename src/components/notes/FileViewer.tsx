import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface FileViewerProps {
  fileUrl: string;
  title: string;
  height?: string;
}

export const FileViewer = ({ fileUrl, title, height = '600px' }: FileViewerProps) => {
  const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

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
              onClick={() => window.open(fileUrl, '_blank')}
              className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ExternalLink size={12} className="mr-1" /> Open in New Tab
            </Button>
          </div>
          <iframe src={fileUrl} style={{ height }} className="w-full border-0" title={title} />
        </div>
      ) : isImage ? (
        <div className="p-4 flex flex-col items-center">
          <img src={fileUrl} className="max-w-full h-auto max-h-[550px] rounded border dark:border-gray-800" alt={title} />
          <div className="mt-3 w-full flex justify-between items-center text-xs">
            <span className="font-medium truncate text-gray-700 dark:text-gray-300">
              📷 {title || 'Attached Image'}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(fileUrl, '_blank')}
              className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ExternalLink size={12} className="mr-1" /> View Full Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/10">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Preview not available for this file type.</p>
          <Button onClick={() => window.open(fileUrl, '_blank')} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Download className="w-4 h-4 mr-2" /> Download Document
          </Button>
        </div>
      )}
    </div>
  );
};
