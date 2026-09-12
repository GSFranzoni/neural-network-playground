import type { NeuralNetwork } from "@/lib/neural-network";
import type { Bounds } from "@/types/app";

type Size = {
  width: number;
  height: number;
};

function colorFromToken(token: string): [number, number, number] {
  const swatch = document.createElement("canvas");
  const context = swatch.getContext("2d")!;
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue];
}

function probabilityOfClassOne(output: number[]): number {
  if (output.length === 1) {
    return 1 / (1 + Math.exp(-output[0]));
  }

  const largest = Math.max(...output);
  const probabilities = output.map((value) => Math.exp(value - largest));
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  return total === 0 ? 0.5 : probabilities[1] / total;
}

function resizeCanvas(canvas: HTMLCanvasElement, size: Size): CanvasRenderingContext2D | null {
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size.width * dpr);
  canvas.height = Math.round(size.height * dpr);
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}

export function drawDecisionSurface(
  canvas: HTMLCanvasElement,
  network: NeuralNetwork,
  bounds: Bounds,
  size: Size,
): void {
  const context = resizeCanvas(canvas, size);
  if (!context) {
    return;
  }

  const columns = Math.max(2, Math.min(180, Math.round(size.width / 3)));
  const rows = Math.max(2, Math.min(180, Math.round(size.height / 3)));
  const image = context.createImageData(columns, rows);
  const classA = colorFromToken("--classification-a");
  const classB = colorFromToken("--classification-b");

  for (let row = 0; row < rows; row++) {
    const y = bounds.maxY - ((row + 0.5) / rows) * (bounds.maxY - bounds.minY);
    for (let column = 0; column < columns; column++) {
      const x = bounds.minX + ((column + 0.5) / columns) * (bounds.maxX - bounds.minX);
      const confidence = probabilityOfClassOne(network.forward([x, y]));
      const index = (row * columns + column) * 4;
      image.data[index] = Math.round(classA[0] + (classB[0] - classA[0]) * confidence);
      image.data[index + 1] = Math.round(classA[1] + (classB[1] - classA[1]) * confidence);
      image.data[index + 2] = Math.round(classA[2] + (classB[2] - classA[2]) * confidence);
      image.data[index + 3] = 105;
    }
  }

  const buffer = document.createElement("canvas");
  buffer.width = columns;
  buffer.height = rows;
  buffer.getContext("2d")?.putImageData(image, 0, 0);
  context.clearRect(0, 0, size.width, size.height);
  context.imageSmoothingEnabled = true;
  context.drawImage(buffer, 0, 0, size.width, size.height);
}
