import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'data-access-auth';

@Component({
  selector: 'app-role-redirect',
  template: '',
  standalone: true,
})
export class RoleRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user?.role === 'admin') {
      this.router.navigateByUrl('/admin', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }
}
