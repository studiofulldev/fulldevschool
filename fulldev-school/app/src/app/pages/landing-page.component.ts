import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent {
  protected readonly avatars = [
    { initials: 'AB', bg: '#1e1000' }, { initials: 'RM', bg: '#001018' },
    { initials: 'LF', bg: '#120018' }, { initials: 'PH', bg: '#001810' },
    { initials: 'JS', bg: '#180008' }, { initials: 'CH', bg: '#181000' },
    { initials: 'AK', bg: '#001818' }, { initials: 'MS', bg: '#180010' },
    { initials: 'TC', bg: '#001010' }, { initials: 'BR', bg: '#101800' },
    { initials: 'GF', bg: '#1e1000' }, { initials: 'VL', bg: '#00001e' },
    { initials: 'DN', bg: '#1e1e00' }, { initials: 'KA', bg: '#001400' },
    { initials: 'FP', bg: '#140014' }, { initials: 'SO', bg: '#001400' },
    { initials: 'WB', bg: '#1e0010' }, { initials: 'CR', bg: '#001e10' },
    { initials: 'NP', bg: '#100018' }, { initials: 'EA', bg: '#181800' },
  ];
}
