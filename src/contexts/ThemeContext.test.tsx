import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

const TestComponent = () => {
  const { mode, setMode, colorTheme, setColorTheme, resetColorTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{mode}</span>
      <span data-testid="color-val">{colorTheme.name}</span>
      <span data-testid="primary-val">{colorTheme.primary}</span>
      <button data-testid="set-light" onClick={() => setMode('light')}>Light</button>
      <button data-testid="set-dark" onClick={() => setMode('dark')}>Dark</button>
      <button data-testid="set-system" onClick={() => setMode('system')}>System</button>
      <button data-testid="set-custom-color" onClick={() => setColorTheme({ name: 'Custom Emerald', primary: '#059669', secondary: '#10b981', gradient: '' })}>Custom Color</button>
      <button data-testid="reset-color" onClick={resetColorTheme}>Reset Color</button>
    </div>
  );
};

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const localStorageMock = new LocalStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

describe('ThemeContext & ThemeProvider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
  });

  it('should initialize with defaultTheme and default color theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(screen.getByTestId('color-val').textContent).toBe('Default Blue');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#2a78d6');
  });

  it('should initialize with stored mode from localStorage', () => {
    localStorage.setItem('ui-theme', 'light');
    render(
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should change mode independently and save to localStorage', () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);

    const darkBtn = screen.getByTestId('set-dark');
    act(() => {
      darkBtn.click();
    });

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('ui-theme')).toBe('dark');
  });

  it('should change accent color theme and update CSS variables', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    const customColorBtn = screen.getByTestId('set-custom-color');
    act(() => {
      customColorBtn.click();
    });

    expect(screen.getByTestId('color-val').textContent).toBe('Custom Emerald');
    expect(screen.getByTestId('primary-val').textContent).toBe('#059669');
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#059669');
    expect(localStorage.getItem('study-app-color-theme')).toContain('Custom Emerald');
  });

  it('should handle system theme preferences when set to system', () => {
    const matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMediaMock);

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

