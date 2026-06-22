import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette, Users, BookOpen, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, Image, Upload, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const availableIcons = [
  { name: 'Users', icon: Users, label: 'Users' },
  { name: 'BookOpen', icon: BookOpen, label: 'Book' },
  { name: 'Calculator', icon: Calculator, label: 'Calculator' },
  { name: 'Atom', icon: Atom, label: 'Science' },
  { name: 'Code', icon: Code, label: 'Code' },
  { name: 'Globe', icon: Globe, label: 'Globe' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'Camera', icon: Camera, label: 'Camera' },
  { name: 'Heart', icon: Heart, label: 'Heart' },
  { name: 'Star', icon: Star, label: 'Star' },
  { name: 'Zap', icon: Zap, label: 'Lightning' }
];

export const availableColors = [
  { name: 'from-blue-500 to-blue-600', label: 'Blue', color: '#3B82F6' },
  { name: 'from-purple-500 to-purple-600', label: 'Purple', color: '#8B5CF6' },
  { name: 'from-green-500 to-green-600', label: 'Green', color: '#10B981' },
  { name: 'from-red-500 to-red-600', label: 'Red', color: '#EF4444' },
  { name: 'from-orange-500 to-orange-600', label: 'Orange', color: '#F97316' },
  { name: 'from-pink-500 to-pink-600', label: 'Pink', color: '#EC4899' },
  { name: 'from-indigo-500 to-indigo-600', label: 'Indigo', color: '#6366F1' },
  { name: 'from-teal-500 to-teal-600', label: 'Teal', color: '#14B8A6' },
  { name: 'from-yellow-500 to-yellow-600', label: 'Yellow', color: '#EAB308' },
  { name: 'from-cyan-500 to-cyan-600', label: 'Cyan', color: '#06B6D4' }
];

interface GroupAppearanceProps {
  formData: {
    color: string;
    icon: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  loading: boolean;
  useCustomImage: boolean;
  setUseCustomImage: (useCustom: boolean) => void;
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
}

export const GroupAppearance = ({
  formData,
  setFormData,
  loading,
  useCustomImage,
  setUseCustomImage,
  uploadedImage,
  setUploadedImage
}: GroupAppearanceProps) => {
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setUseCustomImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Group Icon</Label>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={!useCustomImage ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setUseCustomImage(false);
                setUploadedImage(null);
              }}
              disabled={loading}
            >
              <Users size={16} className="mr-2" />
              Icon Library
            </Button>
            <Button
              type="button"
              variant={useCustomImage ? "default" : "outline"}
              size="sm"
              onClick={() => setUseCustomImage(true)}
              disabled={loading}
            >
              <Image size={16} className="mr-2" />
              Custom Image
            </Button>
          </div>
          
          {!useCustomImage ? (
            <div className="grid grid-cols-6 gap-3">
              {availableIcons.map((iconOption) => {
                const IconComponent = iconOption.icon;
                const isSelected = formData.icon === iconOption.name;
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.name }))}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    disabled={loading}
                    title={iconOption.label}
                  >
                    <IconComponent 
                      size={20} 
                      className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} 
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="icon-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="icon-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Upload size={16} />
                    Choose Image
                  </label>
                </div>
                {uploadedImage && (
                  <div className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <img 
                      src={uploadedImage} 
                      alt="Group icon preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload an image (max 5MB). Recommended size: 64x64 pixels.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Background Color</Label>
          <div className="grid grid-cols-5 gap-3">
            {availableColors.map((colorOption) => {
              const isSelected = formData.color === colorOption.name;
              return (
                <button
                  key={colorOption.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: colorOption.name }))}
                  className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    isSelected 
                      ? 'border-gray-800 dark:border-white shadow-lg' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  disabled={loading}
                  title={colorOption.label}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className={`h-20 bg-gradient-to-br ${formData.color} rounded-lg relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute bottom-3 left-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                {useCustomImage && uploadedImage ? (
                  <img 
                    src={uploadedImage} 
                    alt="Group icon" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  (() => {
                    const selectedIcon = availableIcons.find(i => i.name === formData.icon);
                    const IconComponent = selectedIcon?.icon || Users;
                    return <IconComponent size={18} className="text-white" />;
                  })()
                )}
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <div className="bg-yellow-400 p-1 rounded-full">
                <Crown size={12} className="text-yellow-800" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
