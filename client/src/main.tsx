import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { RegistrationPage } from './features/registrations/RegistrationPage.js';

const eventId = /^\/events\/([0-9a-f-]+)\/?$/i.exec(window.location.pathname)?.[1];
createRoot(document.getElementById('root')!).render(
  <StrictMode><RegistrationPage eventId={eventId} /></StrictMode>,
);
