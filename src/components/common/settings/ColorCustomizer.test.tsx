import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ColorCustomizer } from './ColorCustomizer';

const defaultTheme = { name: 'Default Blue', primary: '#3b82f6', secondary: '#1e40af', gradient: 'from-blue-50 to-indigo-100' };
const darkTheme = { name: 'Dark Navy', primary: '#1e293b', secondary: '#334155', gradient: 'from-slate-900 to-slate-800' };

describe('ColorCustomizer Component', () => {
  let onThemeChangeMock = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = '';
    onThemeChangeMock = vi.fn();
    document.documentElement.className = '';
  });

  it('renders trigger button and opens popover on click', () => {
    render(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    const triggerBtn = screen.getByRole('button', { name: /Customize Colors/i });
    expect(triggerBtn).toBeInTheDocument();

    fireEvent.click(triggerBtn);

    expect(screen.getByText('Color Theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('calls onThemeChange and removes dark class when a light theme is clicked', () => {
    document.documentElement.classList.add('dark');

    render(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /Customize Colors/i }));

    const oceanCard = screen.getByText('Ocean Blue');
    fireEvent.click(oceanCard);

    expect(onThemeChangeMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ocean Blue' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('calls onThemeChange and adds dark class when a dark theme is clicked', () => {
    render(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /Customize Colors/i }));

    const darkCard = screen.getByText('Dark Navy');
    fireEvent.click(darkCard);

    expect(onThemeChangeMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Dark Navy' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('resets theme to default on clicking Reset button', () => {
    document.documentElement.classList.add('dark');

    render(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={darkTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /Customize Colors/i }));

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(onThemeChangeMock).toHaveBeenCalledWith(defaultTheme);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
