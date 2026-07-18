import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownEditor } from './MarkdownEditor/index';

describe('MarkdownEditor Component', () => {
  it('renders dropdown select style and formatting buttons', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="Hello" onChange={handleChange} />);
    
    // Check style select dropdown
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    
    // Check basic formatting buttons
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bullet/i })).toBeInTheDocument();
  });

  it('triggers block formatting command in rich text mode', () => {
    const handleChange = vi.fn();
    document.execCommand = vi.fn();
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true);
    
    render(<MarkdownEditor value="Hello" onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'h1' } });
    
    expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, '<H1>');
    execCommandSpy.mockRestore();
  });

  it('triggers style formatting commands and lists in plain text mode', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="Hello" onChange={handleChange} />);
    
    // Switch to plain text editing
    const toggleButton = screen.getByRole('button', { name: /Switch to plain text/i });
    fireEvent.click(toggleButton);
    
    // Test heading format in plain text mode (select is modified to trigger handleCommand)
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'h1' } });
    expect(handleChange).toHaveBeenCalled();

    // Click bullet button
    const bulletButton = screen.getByRole('button', { name: /bullet/i });
    fireEvent.mouseDown(bulletButton);
    expect(handleChange).toHaveBeenCalled();
  });
});
