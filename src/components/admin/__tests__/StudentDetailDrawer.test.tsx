import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentDetailDrawer from '../StudentDetailDrawer';

describe('StudentDetailDrawer', () => {
  const student = { id: 1, name: 'John Doe', student_id: 'ID-001', school_class: 2, gender: 'Male', status: 'Active' };
  const classes = [{ id: 2, name: 'Form 1' }];

  it('renders form fields and calls onSave with updated data', async () => {
    vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }));
    const onSave = vi.fn(() => Promise.resolve());
    const onClose = vi.fn();

    render(<StudentDetailDrawer open={true} onClose={onClose} student={student} classes={classes} onSave={onSave} />);

    // verify inputs by display value
    const nameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;
    const idInput = screen.getByDisplayValue('ID-001') as HTMLInputElement;
    const saveBtn = screen.getByText(/Save Changes/i);

    expect(nameInput).toBeTruthy();
    expect(idInput).toBeTruthy();

    // change name and save
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Jane Doe' }));
    });
  });
});
