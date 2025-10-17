
import { useState } from 'react';
import { FileText, Users, Clock, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateCollaborativeDocDialog } from './CreateCollaborativeDocDialog';

interface Document {
  id: string;
  title: string;
  collaborators: number;
  lastModified: string;
  type: string;
  isActive: boolean;
}

interface CollaborativeDocsDashboardProps {
  onOpenDocument?: (documentId: string) => void;
}

export const CollaborativeDocsDashboard = ({ onOpenDocument }: CollaborativeDocsDashboardProps) => {
  const [documents] = useState<Document[]>([
    {
      id: '1',
      title: 'Study Notes - Chapter 7',
      collaborators: 3,
      lastModified: '2 minutes ago',
      type: 'Study Notes',
      isActive: true
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      collaborators: 2,
      lastModified: '15 minutes ago',
      type: 'Lab Report',
      isActive: true
    },
    {
      id: '3',
      title: 'Math Problem Set',
      collaborators: 5,
      lastModified: '1 hour ago',
      type: 'Problem Set',
      isActive: false
    },
    {
      id: '4',
      title: 'History Essay Draft',
      collaborators: 1,
      lastModified: '3 hours ago',
      type: 'Essay',
      isActive: false
    }
  ]);

  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

  const activeDocuments = documents.filter(doc => doc.isActive);
  const recentDocuments = documents.filter(doc => !doc.isActive);

  const handleOpenDocument = (documentId: string) => {
    console.log('Opening document:', documentId);
    setCurrentDocumentId(documentId);
    if (onOpenDocument) {
      onOpenDocument(documentId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Collaborative Documents</h2>
          <p className="text-gray-600 dark:text-gray-300">Real-time document collaboration</p>
        </div>
        <CreateCollaborativeDocDialog onDocumentCreated={() => window.location.reload()} />
      </div>

      {/* Active Documents */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users size={20} className="mr-2 text-green-500" />
            Currently Active ({activeDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  currentDocumentId === doc.id 
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600' 
                    : 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentDocumentId === doc.id ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 flex items-center">
                      {doc.title}
                      {currentDocumentId === doc.id && (
                        <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          Currently Open
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {doc.collaborators} active
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {doc.lastModified}
                      </span>
                      <span className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                        {doc.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleOpenDocument(doc.id)}
                  >
                    <Edit size={14} className="mr-1" />
                    {currentDocumentId === doc.id ? 'Continue Editing' : 'Edit'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText size={20} className="mr-2 text-gray-500" />
            Recent Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">{doc.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {doc.lastModified}
                      </span>
                      <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {doc.type}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleOpenDocument(doc.id)}
                >
                  <Edit size={14} className="mr-1" />
                  Open
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
