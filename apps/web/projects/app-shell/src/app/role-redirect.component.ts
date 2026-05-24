import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'lib-auth-data-access';

@Component({
  selector: 'app-role-redirect',
  template: '',
  standalone: true,
})
export class RoleRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }
}
