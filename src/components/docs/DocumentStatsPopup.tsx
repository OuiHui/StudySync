
import { BarChart3, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentStatsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export const DocumentStatsPopup = ({ isOpen, onClose, content }: DocumentStatsPopupProps) => {
  const stats = {
    words: content.split(' ').filter(word => word.length > 0).length,
    characters: content.length,
    paragraphs: content.split('\n\n').filter(p => p.trim().length > 0).length,
    readingTime: Math.ceil(content.split(' ').length / 200)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 size={20} className="mr-2" />
            Document Statistics
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.words}</div>
              <div className="text-sm text-gray-600">Words</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.characters}</div>
              <div className="text-sm text-gray-600">Characters</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-purple-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.paragraphs}</div>
              <div className="text-sm text-gray-600">Paragraphs</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-orange-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.readingTime}</div>
              <div className="text-sm text-gray-600">Min read</div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
