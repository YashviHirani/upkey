import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage.jsx';

/**
 * Mock 3D Canvas component in JSDOM environment
 * Since WebGL is not available in headless Node.js/JSDOM, we mock HeroBottle3D
 * while verifying the rest of the layout, scroll chapters, and side content.
 */
vi.mock('../components/HeroBottle3D', () => ({
  default: function MockHeroBottle3D({ scrollProgress }) {
    return <div data-testid="mock-3d-bottle" data-scroll={scrollProgress} />;
  }
}));

describe('LandingPage Component', () => {
  it('renders Joyory Aura brand title and all 4 scroll chapters', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Verify Brand Logo & Navigation
    expect(screen.getByText('Joyory Aura')).toBeInTheDocument();
    expect(screen.getByText('Explainable Beauty AI')).toBeInTheDocument();

    // Verify 3D Bottle Canvas container is present
    expect(screen.getByTestId('mock-3d-bottle')).toBeInTheDocument();

    // Verify Chapter 1: Hero (Left) & Live telemetry score (Right)
    expect(screen.getByText(/Beauty That/i)).toBeInTheDocument();
    expect(screen.getByText(/Fits Your Skin/i)).toBeInTheDocument();
    expect(screen.getByText(/Formulation Match Rating/i)).toBeInTheDocument();

    // Verify Chapter 2: Diagnostic (Left) & Visible reason tags (Right)
    expect(screen.getByText(/Interactive Skin Diagnostic/i)).toBeInTheDocument();
    expect(screen.getByText(/Visible Algorithmic Reasons/i)).toBeInTheDocument();

    // Verify Chapter 3: Dupe Engine (Left) & Transparent trade-offs (Right)
    expect(screen.getByText(/Save 68% On Equivalent Actives/i)).toBeInTheDocument();
    expect(screen.getByText(/Transparent Trade-Off Breakdown/i)).toBeInTheDocument();

    // Verify Chapter 4: Catalog Search (Left) & Routine Basket (Right)
    expect(screen.getByText(/Browse Active Formulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Routine Basket/i)).toBeInTheDocument();
  });
});
