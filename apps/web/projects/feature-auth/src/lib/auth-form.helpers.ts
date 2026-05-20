import { ValidationError } from '@angular/forms/signals';

export function trackError(index: number, error: ValidationError): string {
  return `${index}-${error.kind}-${error.message}`;
}
