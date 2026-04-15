import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('matrixCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationId = 0;
  private cleanupFn: (() => void) | null = null;

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.startMatrix();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    this.cleanupFn?.();
  }

  private startMatrix(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const FONT_SIZE = 13;
    const TRAIL_LENGTH = 22;
    const CHARS = '01アイウエオカキクケコ{}[]()<>;undefined null NaN'.split('');

    interface Drop {
      row: number;
      trail: string[];
      speed: number; // frames per step
      frame: number;
    }

    let drops: Drop[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / FONT_SIZE);
      drops = Array.from({ length: columns }, () => ({
        row: -Math.floor(Math.random() * 40),
        trail: Array.from({ length: TRAIL_LENGTH }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
        speed: 2 + Math.floor(Math.random() * 3), // 2–4 frames per step
        frame: 0
      }));
    };

    init();

    const onResize = () => init();
    window.addEventListener('resize', onResize);
    this.cleanupFn = () => window.removeEventListener('resize', onResize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px monospace`;

      drops.forEach((drop, col) => {
        // Advance on every `speed` frames
        drop.frame++;
        if (drop.frame >= drop.speed) {
          drop.frame = 0;
          drop.row++;

          // Randomly mutate a trail char
          if (Math.random() < 0.15) {
            const idx = Math.floor(Math.random() * TRAIL_LENGTH);
            drop.trail[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
          }

          // Reset drop when fully off screen
          if ((drop.row - TRAIL_LENGTH) * FONT_SIZE > canvas.height) {
            drop.row = -Math.floor(Math.random() * 20);
            drop.trail = Array.from({ length: TRAIL_LENGTH }, () =>
              CHARS[Math.floor(Math.random() * CHARS.length)]
            );
          }
        }

        // Draw trail (head → tail)
        for (let t = 0; t < TRAIL_LENGTH; t++) {
          const y = (drop.row - t) * FONT_SIZE;
          if (y < -FONT_SIZE || y > canvas.height) continue;

          const x = col * FONT_SIZE;
          const progress = 1 - t / TRAIL_LENGTH;

          if (t === 0) {
            // Head: bright pinkish-white
            ctx.fillStyle = 'rgba(255, 200, 200, 0.95)';
          } else {
            // Trail: red fading out
            ctx.fillStyle = `rgba(220, 38, 38, ${(progress * 0.75).toFixed(2)})`;
          }

          ctx.fillText(drop.trail[t], x, y);
        }
      });

      this.animationId = requestAnimationFrame(draw);
    };

    draw();
  }
}
