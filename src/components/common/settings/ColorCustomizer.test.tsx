import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ColorCustomizer } from './ColorCustomizer';
import { DEFAULT_THEME } from '@/constants/theme';
import { ThemeProvider } from '@/contexts/ThemeContext';

const defaultTheme = DEFAULT_THEME;

const renderWithProvider = (ui: React.ReactNode) => {
  return render(
    <ThemeProvider defaultTheme="dark">
      {ui}
    </ThemeProvider>
  );
};

describe('ColorCustomizer Component', () => {
  let onThemeChangeMock = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = '';
    onThemeChangeMock = vi.fn();
    document.documentElement.className = '';
  });

  it('renders trigger button and opens popover on click', () => {
    renderWithProvider(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    const triggerBtn = screen.getByRole('button', { name: /Theme Options/i });
    expect(triggerBtn).toBeInTheDocument();

    fireEvent.click(triggerBtn);

    expect(screen.getByText('Appearance & Theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    expect(screen.getByText('Theme Mode')).toBeInTheDocument();
  });

  it('allows selecting mode (Light/Dark/System) independently from accent color', () => {
    renderWithProvider(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /Theme Options/i }));

    const lightModeBtn = screen.getByRole('button', { name: /Light/i });
    fireEvent.click(lightModeBtn);

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('calls onThemeChange when an accent color preset is clicked', () => {
    renderWithProvider(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /Theme Options/i }));

    const oceanBtn = screen.getByTitle('Ocean Blue');
    fireEvent.click(oceanBtn);

    expect(onThemeChangeMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ocean Blue' }));
  });

  it('resets theme to default on clicking Reset button', () => {
    renderWithProvider(<ColorCustomizer onThemeChange={onThemeChangeMock} currentTheme={defaultTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /Theme Options/i }));

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(onThemeChangeMock).toHaveBeenCalledWith(defaultTheme);
  });
});


