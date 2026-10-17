import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SpaceshipHome } from './ui/screens/SpaceshipHome';

// Standalone entry for the spaceship lobby. The game client (web/src/app/) can
// render <SpaceshipHome onEnterBattle={...} lobby={...} /> instead.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpaceshipHome />
  </StrictMode>,
);
