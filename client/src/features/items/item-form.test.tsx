// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ItemForm } from './item-form';
import { ApiError } from '../../lib/http';
afterEach(cleanup);

describe('item form', () => {
  it('shows validation errors instead of submitting an empty item', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ItemForm pending={false} error={null} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Add to the community shelf' }));
    expect(await screen.findAllByRole('alert')).toHaveLength(3);
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it('submits validated input and keeps server errors visible', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ItemForm
        pending={false}
        error={new ApiError('Item changed; refresh and try again', 409)}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText('Item title'), 'Weekend tent');
    await user.type(screen.getByLabelText('Description'), 'A two-person tent with a rain cover.');
    await user.type(screen.getByLabelText('General pickup area'), 'Community centre');
    await user.click(screen.getByRole('button', { name: 'Add to the community shelf' }));
    expect(onSubmit).toHaveBeenCalledWith(
      {
        title: 'Weekend tent',
        description: 'A two-person tent with a rain cover.',
        category: 'Tools',
        condition: 'Good',
        pickupArea: 'Community centre',
        imageUrl: '',
      },
      expect.anything(),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Item changed; refresh and try again');
  });
});
