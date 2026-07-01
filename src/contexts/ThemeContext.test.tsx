import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

const TestComponent = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Light</button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="set-system" onClick={() => setTheme('system')}>System</button>
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
  });

  it('should initialize with defaultTheme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should initialize with stored theme from localStorage', () => {
    localStorage.setItem('ui-theme', 'light');
    render(
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should change theme and save to localStorage', () => {
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
