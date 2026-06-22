import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, Image, Upload, Crown, Check, X } from 'lucide-react';
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
  { name: 'from-blue-500 to-blue-600', label: 'Blue', color: '#3B82F6', colorEnd: '#2563EB' },
  { name: 'from-purple-500 to-purple-600', label: 'Purple', color: '#8B5CF6', colorEnd: '#7C3AED' },
  { name: 'from-green-500 to-green-600', label: 'Green', color: '#10B981', colorEnd: '#059669' },
  { name: 'from-red-500 to-red-600', label: 'Red', color: '#EF4444', colorEnd: '#DC2626' },
  { name: 'from-orange-500 to-orange-600', label: 'Orange', color: '#F97316', colorEnd: '#EA580C' },
  { name: 'from-pink-500 to-pink-600', label: 'Pink', color: '#EC4899', colorEnd: '#DB2777' },
  { name: 'from-indigo-500 to-indigo-600', label: 'Indigo', color: '#6366F1', colorEnd: '#4F46E5' },
  { name: 'from-teal-500 to-teal-600', label: 'Teal', color: '#14B8A6', colorEnd: '#0D9488' },
  { name: 'from-yellow-500 to-yellow-600', label: 'Yellow', color: '#EAB308', colorEnd: '#CA8A04' },
  { name: 'from-cyan-500 to-cyan-600', label: 'Cyan', color: '#06B6D4', colorEnd: '#0891B2' }
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
    <div className="space-y-6">
      {/* Icon selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Group Icon</Label>
        
        {/* Toggle buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setUseCustomImage(false);
              setUploadedImage(null);
            }}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              !useCustomImage
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <Users size={15} />
            Icon Library
          </button>
          <button
            type="button"
            onClick={() => setUseCustomImage(true)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              useCustomImage
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <Image size={15} />
            Custom Image
          </button>
        </div>
        
        {!useCustomImage ? (
          <div className="grid grid-cols-6 gap-2">
            {availableIcons.map((iconOption) => {
              const IconComponent = iconOption.icon;
              const isSelected = formData.icon === iconOption.name;
              return (
                <button
                  key={iconOption.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.name }))}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 group/icon ${
                    isSelected 
                      ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm shadow-blue-500/10' 
                      : 'border-gray-100 dark:border-gray-700/60 hover:border-blue-200 dark:hover:border-blue-800 bg-white dark:bg-gray-800/40'
                  }`}
                  disabled={loading}
                  title={iconOption.label}
                >
                  <IconComponent 
                    size={20} 
                    className={`mx-auto transition-colors duration-200 ${
                      isSelected 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500 group-hover/icon:text-gray-600 dark:group-hover/icon:text-gray-300'
                    }`} 
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
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
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 text-sm text-gray-500 dark:text-gray-400"
                >
                  <Upload size={16} />
                  Choose an image file
                </label>
              </div>
              {uploadedImage && (
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <img 
                      src={uploadedImage} 
                      alt="Group icon preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImage(null);
                      setUseCustomImage(false);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Upload an image (max 5MB). Recommended: square, at least 64×64 pixels.
            </p>
          </div>
        )}
      </div>

      {/* Color selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Banner Color</Label>
        <div className="grid grid-cols-5 gap-2.5">
          {availableColors.map((colorOption) => {
            const isSelected = formData.color === colorOption.name;
            return (
              <button
                key={colorOption.name}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color: colorOption.name }))}
                className={`relative h-11 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                  isSelected 
                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                style={{ 
                  background: `linear-gradient(135deg, ${colorOption.color}, ${colorOption.colorEnd})`,
                  ...(isSelected ? { ringColor: colorOption.color } : {})
                }}
                disabled={loading}
                title={colorOption.label}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white drop-shadow-sm" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview note */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50/60 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          Live preview is shown in the header above
        </p>
      </div>
    </div>
  );
};
