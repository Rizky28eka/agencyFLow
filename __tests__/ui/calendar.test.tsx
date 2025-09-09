
import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import CalendarPage from '@/app/(internal)/internal/calendar/page';

vi.mock('@/app/actions/project-views', () => ({
  getCalendarEvents: vi.fn(() =>
    Promise.resolve({
      projects: [
        {
          id: 'proj1',
          name: 'Project Alpha',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-15'),
        },
      ],
      tasks: [
        {
          id: 'task1',
          title: 'Task One',
          startDate: new Date('2025-01-05'),
          dueDate: new Date('2025-01-10'),
        },
      ],
    })
  ),
}));

it('renders CalendarPage correctly', async () => {
  const { asFragment } = render(<CalendarPage />);
  // Wait for data to load
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(asFragment()).toMatchSnapshot();
});
