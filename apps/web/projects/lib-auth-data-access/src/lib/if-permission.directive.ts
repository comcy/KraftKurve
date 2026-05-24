import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission } from './auth.permissions';

@Directive({
  selector: '[ifPermission]',
  standalone: true,
})
export class IfPermissionDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly permission = signal<Permission | Permission[] | null>(null);

  @Input('ifPermission') set ifPermission(value: Permission | Permission[]) {
    this.permission.set(value);
  }

  constructor() {
    effect(() => {
      const p = this.permission();
      if (!p) {
        this.viewContainer.clear();
        return;
      }

      const hasPermission = Array.isArray(p)
        ? this.authService.hasAnyPermission(p)
        : this.authService.hasPermission(p);

      this.viewContainer.clear();
      if (hasPermission) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
