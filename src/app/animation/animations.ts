import { animate, state, style, transition, trigger } from '@angular/animations';

// Login
export const loginFormAnimation = trigger('loginFormAnimation', [
  state('bottom', style({ transform: 'translateY(0vh)' })),
  state('center', style({ transform: 'translateY(-100vh)' })),
  transition('bottom <=> center', [animate('1200ms ease-in-out')])
]);
