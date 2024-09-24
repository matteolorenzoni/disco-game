import { animate, state, style, transition, trigger } from '@angular/animations';

// Login
export const loginFormAnimation = trigger('loginFormAnimation', [
  state('bottom', style({ transform: 'translateY(0vh)' })),
  state('center', style({ transform: 'translateY(-100vh)' })),
  transition('bottom <=> center', [animate('1200ms ease-in-out')])
]);

// Sidebar
export const sideMenuAnimation = trigger('sideMenuAnimation', [
  state('hidden', style({ left: '-16rem' })),
  state('visible', style({ left: '0rem' })),
  transition('hidden <=> visible', [animate('300ms ease-in-out')])
]);
