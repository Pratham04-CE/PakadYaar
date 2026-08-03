import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';

test('renders PakadYaar application title', () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
  const titleElements = screen.getAllByText(/Pakad/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
