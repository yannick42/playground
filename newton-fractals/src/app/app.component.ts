import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import Complex from 'complex.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'newton-fractals';
	
	@ViewChild('myCanvas')
  canvasRef: ElementRef<HTMLCanvasElement>;
	canvas: HTMLCanvasElement|null;
	time: string;

  context: CanvasRenderingContext2D | null;

  constructor() {
		this.canvasRef = {} as ElementRef<HTMLCanvasElement>;
    this.context = null;
		this.canvas = null;
		this.time = '?';
	}

  ngAfterViewInit(): void {
		this.canvas = this.canvasRef.nativeElement;
    this.context = this.canvas.getContext('2d');
		this.initCanvas();
		this.fillGrid();
  }

	initCanvas() {
		if(this.canvas) {
			this.canvas.width = 500;
			this.canvas.height = 500;
		}
	}

	// => z^3 - 1
	func(z: Complex): Complex { // z = x + iy
		return z.pow(3).sub(1);
	}

	funcPrime(z: Complex): Complex {
		return z.pow(2).mul(3);
	}

	newtonRaphson(x: number, y: number) {

		let i = 0;
		
		//console.log("newton raphson from x, y = ", x, y);
		
		do {
			const z = new Complex(x, y);
			const c = this.func(z);
			const cprime = this.funcPrime(z);
			
			//console.log("c:", c, "cprime:", cprime);

			// Newton-Raphson formula
			const z_n1 = (new Complex(x, y)).sub(c.div(cprime));
			//console.warn("new x, y:", z_n1)

			if(z_n1.sub(z).abs() <= 0.1) // converge
			{
				break;
			}

			//console.log("------");

			[x, y] = [z_n1.re, z_n1.im];
			i += 1;
		} while (i < 100);

		//console.log("in", i, "iterations:", x, y);

		const thres = 0.11;
		// roots
		if(Math.abs(x - 1) <= thres && Math.abs(y) <= thres) {
			return "red";
		} else if (Math.abs(x + 0.5) <= thres && Math.abs(y - Math.sqrt(3)/2) <= thres) {
			return "blue";
		} else if (Math.abs(x + 0.5) <= thres && Math.abs(y + Math.sqrt(3)/2) <= thres) {
			return "lightgreen";
		}
		
		return "black";
	}

	fillGrid() {

		if(!this.context) return;

		const start = Date.now();

		const width = this.canvas?.width ?? 10,
					height = this.canvas?.height ?? 10;

		const xOffset = 250,
					yOffset = 250;

		for(let x = 0; x < width; x++) {
			for(let y = 0; y < height; y++) {
				const color = this.newtonRaphson(x-xOffset, y-yOffset);
				this.context.fillStyle = color;
				this.context.fillRect(x, y, 1, 1);		
			}
		}

		const millis = Date.now() - start;
		this.time = `Generated in JS in ${Math.floor(millis / 1000)} seconds`;

	}
	
}
