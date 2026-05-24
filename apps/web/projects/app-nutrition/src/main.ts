// Define ngDevMode at the very top to prevent ReferenceError in dev mode
(window as any).ngDevMode = (window as any).ngDevMode || false;

import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
