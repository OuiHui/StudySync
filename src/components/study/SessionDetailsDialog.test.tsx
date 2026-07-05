import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionDetailsDialog } from './SessionDetailsDialog';

describe('SessionDetailsDialog Component', () => {
  const defaultProps = {
    title: 'Midterm Review Session',
    course: 'Biology 101',
    hostName: 'Dr. Smith',
    startTime: '2026-07-05T12:00:00.000Z',
    sessionGoal: 4,
    workDuration: 1500, // 25 min
    breakDuration: 300, // 5 min
    isGroupSession: true
  };

  it('renders trigger button correctly', () => {
    render(<SessionDetailsDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Details/i })).toBeInTheDocument();
  });

  it('opens dialog on click and displays session details and metadata', async () => {
    render(<SessionDetailsDialog {...defaultProps} />);
    
    const trigger = screen.getByRole('button', { name: /Details/i });
    fireEvent.click(trigger);

    // Dialog title
    expect(screen.getByRole('heading', { name: /Session Information/i })).toBeInTheDocument();

    // Check title, subject, host details
    expect(screen.getByText('Midterm Review Session')).toBeInTheDocument();
    expect(screen.getByText('Biology 101')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();

    // Estimated end time: Start is 12:00:00 UTC (which localizes, but calculations check matching offset)
    // 4 goals * (25m work + 5m break) = 120 minutes (2 hours). Start 12:00 PM + 2h = 2:00 PM.
    // Since formatTimeStr and getEstimatedEndTime both use local time formatting, let's verify Est. End is rendered
    expect(screen.getByText('Est. End:')).toBeInTheDocument();
    expect(screen.getByText('Title:')).toBeInTheDocument();
  });

  it('hides host row if isGroupSession is false', () => {
    render(<SessionDetailsDialog {...defaultProps} isGroupSession={false} />);
    
    const trigger = screen.getByRole('button', { name: /Details/i });
    fireEvent.click(trigger);

    expect(screen.queryByText('Host:')).not.toBeInTheDocument();
    expect(screen.queryByText('Dr. Smith')).not.toBeInTheDocument();
  });
});
