import React from 'react';
// Mock UI Button before importing the component so the module resolves during transform
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }));
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentsSection from '../StudentsSection';

const sampleStudents = [
  { id: 1, name: 'Alice Smith', student_id: 'A001', class_name: 'Form 1', school_class: 1, gender: 'Female', status: 'Active' },
  { id: 2, name: 'Bob Jones', student_id: 'B002', class_name: 'Form 2', school_class: 2, gender: 'Male', status: 'Inactive' },
];

const classes = [{ id: 1, name: 'Form 1' }, { id: 2, name: 'Form 2' }];

describe('StudentsSection', () => {
  it('shows students and filters by search', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <StudentsSection students={sampleStudents as any} isLoading={false} error={null} classes={classes as any} onAddStudent={() => {}} />
      </QueryClientProvider>
    );

    // both present
    expect(screen.getByText(/Alice Smith/)).toBeTruthy();
    expect(screen.getByText(/Bob Jones/)).toBeTruthy();

    // search for Alice
    const input = screen.getByPlaceholderText(/Search students/i);
    fireEvent.change(input, { target: { value: 'Alice' } });

    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.queryByText(/Bob Jones/)).toBeNull();
  });

  it('opens drawer when detail button is clicked', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <StudentsSection students={sampleStudents as any} isLoading={false} error={null} classes={classes as any} onAddStudent={() => {}} />
      </QueryClientProvider>
    );

    // click detail button for first row (there are multiple buttons; find by title-less svg is tricky): find all detail buttons and click the first non-edit one
    const buttons = screen.getAllByRole('button');
    // find a button containing an svg child with circle (the detail button uses inline svg circle)
    const detailButton = buttons.find(btn => btn.querySelector && btn.querySelector('svg') && btn.querySelector('svg')!.outerHTML.includes('<circle'));
    expect(detailButton).toBeTruthy();
    if (detailButton) fireEvent.click(detailButton);

    // drawer should show student profile title
    expect(screen.getByText(/Student Profile/i)).toBeTruthy();
  });
});
