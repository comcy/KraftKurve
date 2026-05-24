// Define ngDevMode at the very top to prevent ReferenceError in dev mode
(window as any).ngDevMode = (window as any).ngDevMode || false;

import { initFederation } from '@angular-architects/native-federation';

initFederation({
  'appAdmin': 'http://localhost:4201/remoteEntry.json',
  'appTraining': 'http://localhost:4202/remoteEntry.json',
  'appNutrition': 'http://localhost:4203/remoteEntry.json'
})
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
