# Modal Design System Specification

## Overview
This document specifies the unified design system for all modal dialogs and popups in StudySync, standardizing them to match the styling of the **Edit Study Group** modal (`GroupSettingsDialog.tsx`).

---

## Component Standards

### 1. Dialog Frame & Container
- **Background**: `bg-white dark:bg-[#1a1f2c]` (Dark Blue theme)
- **Border & Shadows**: `border border-gray-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden`
- **Padding**: `p-6`
- **Text Color**: `text-gray-900 dark:text-zinc-100`

### 2. Header Layout & Title Icon
- **Header Container**: `flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80`
- **Title Layout**: `text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5`
- **Title Icon Badge**:
  Each modal features a dedicated Lucide icon in a styled badge near the title, matching the StudySync app icon aesthetic:
  ```tsx
  <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
    <IconComponent size={18} />
  </div>
  ```
- **Close Button**:
  ```tsx
  <button
    type="button"
    onClick={() => onOpenChange(false)}
    className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
    title="Close"
  >
    <X size={18} />
  </button>
  ```

### 3. Inputs & Form Controls
- **Labels**: `text-sm font-semibold text-gray-800 dark:text-zinc-200`
- **Required Fields**: Required field labels must display a red asterisk: `<span className="text-red-500 ml-1">*</span>`
- **Inputs & Textareas**: `bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6]`

### 4. Toggle Switches & Segmented Levers
- **Radix Switch (`@/components/ui/switch.tsx`)**:
  - Track: `data-[state=checked]:bg-[#2a78d6] data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-slate-800 border border-transparent dark:border-slate-700/60`
  - Thumb: `bg-white shadow-md`
- **Segmented Lever (`Edit Study Group` style)**:
  ```tsx
  <div className="bg-gray-100 dark:bg-[#12151e] p-1 rounded-xl border border-gray-200 dark:border-slate-700/80 flex items-center gap-1">
    <button
      type="button"
      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-[#2a78d6] text-white shadow-sm'
          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      Option Label
    </button>
  </div>
  ```

### 5. Action Buttons & Footers
- **Footer Container**: `pt-4 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5`
- **Primary Action**: `bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold transition-all duration-200`
- **Secondary / Cancel**: `bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors`

---

## 6. Reusable Modal Primitives (`src/components/ui/modal-primitives.tsx`)

To maximize code re-use and guarantee visual consistency across the codebase, use the shared modal primitive wrappers:

```tsx
import { StandardDialogContent, ModalHeader, FormLabel, ModalFooter } from '@/components/ui/modal-primitives';

<Dialog open={isOpen} onOpenChange={onOpenChange}>
  <StandardDialogContent size="lg">
    <ModalHeader title="Modal Title" icon={<Users size={18} />} onClose={() => onOpenChange(false)} />
    
    <form className="space-y-4 pt-1.5">
      <div className="space-y-1">
        <FormLabel htmlFor="field" required>Field Label</FormLabel>
        <Input id="field" />
      </div>
      
      <ModalFooter onCancel={() => onOpenChange(false)}>
        <button type="submit" className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold">
          Save
        </button>
      </ModalFooter>
    </form>
  </StandardDialogContent>
</Dialog>
```

