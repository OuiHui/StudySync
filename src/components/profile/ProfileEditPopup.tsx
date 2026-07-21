import { useState, useEffect } from 'react';
import { User, Camera, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProfileEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    email: string;
    year: string;
    major?: string;
    bio: string;
    profilePicture?: string;
  };
  onSave: (profile: any) => void;
}

const compressImage = (file: File, maxWidth = 300, maxHeight = 300): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const ProfileEditPopup = ({ isOpen, onClose, profile, onSave }: ProfileEditPopupProps) => {
  const [formData, setFormData] = useState(profile);
  const [profileImage, setProfileImage] = useState<string | null>(profile.profilePicture || null);

  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
      setProfileImage(profile.profilePicture || null);
    }
  }, [profile, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setProfileImage(compressed);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  };

  const handleSave = () => {
    onSave({ ...formData, profilePicture: profileImage });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <User size={18} />
            </div>
            Edit Profile
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        
        <div className="space-y-4 pt-1.5">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-2">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-2 border-[#2a78d6]"
                />
              ) : (
                <div className="w-full h-full bg-[#2a78d6]/20 text-[#2a78d6] rounded-full flex items-center justify-center border-2 border-[#2a78d6]">
                  <User size={36} />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-[#2a78d6] text-white p-2 rounded-full cursor-pointer hover:bg-[#2268bc] shadow-md transition-colors">
                <Camera size={14} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Name <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Email <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="major" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Major</Label>
              <Input
                id="major"
                value={formData.major || ''}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="e.g. Computer Science"
                className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="year" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Academic Year</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g. 3rd Year"
                className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="bio" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm leading-relaxed resize-y font-normal"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.email.trim()}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <Save size={15} />
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
