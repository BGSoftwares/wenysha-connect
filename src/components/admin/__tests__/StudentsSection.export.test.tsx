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

describe('StudentsSection CSV export', () => {
  beforeEach(() => {
    // mock URL.createObjectURL
    // @ts-ignore
    global.URL.createObjectURL = vi.fn(() => 'blob:fake');
    // @ts-ignore
    global.URL.revokeObjectURL = vi.fn(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    (global.URL.createObjectURL as any).mockRestore?.();
    (HTMLAnchorElement.prototype.click as any).mockRestore?.();
    vi.clearAllMocks();
  });

  it('exports selected rows when selected mode chosen', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <StudentsSection students={sampleStudents as any} isLoading={false} error={null} classes={classes as any} onAddStudent={() => {}} />
      </QueryClientProvider>
    );

    // select mode -> selected (export select is the second combobox)
    const exportSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(exportSelect, { target: { value: 'selected' } });

    // select first row checkbox (there's header checkbox first)
    const checkboxes = screen.getAllByRole('checkbox');
    // header checkbox at index 0, first row checkbox at index 1
    fireEvent.click(checkboxes[1]);

    // click export button
    const exportBtn = screen.getByText(/Export CSV/i);
    fireEvent.click(exportBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
