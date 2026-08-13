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
      <DialogContent className="max-w-lg w-full bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <User size={18} />
            </div>
            Edit Profile
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                  className="w-full h-full rounded-full object-cover border-2 border-brand"
                />
              ) : (
                <div className="w-full h-full bg-brand/20 text-brand rounded-full flex items-center justify-center border-2 border-brand">
                  <User size={36} />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-brand text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-brand-hover shadow-md transition-colors">
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
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Name <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="major" className="text-sm font-semibold text-foreground">Major</Label>
              <Input
                id="major"
                value={formData.major || ''}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="e.g. Computer Science"
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="year" className="text-sm font-semibold text-foreground">Academic Year</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g. Senior"
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="bio" className="text-sm font-semibold text-foreground">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-brand focus-visible:border-brand text-sm leading-relaxed resize-y font-normal"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-xl px-5 h-10 text-sm font-semibold inline-flex items-center gap-1.5 transition-all duration-200"
            >
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
