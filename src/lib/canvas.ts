import type { ScalarField } from "@/lib/field";

type Size = {
  width: number;
  height: number;
};

type Rgb = [number, number, number];

export type FieldColorScale = (value: number) => Rgb;

function colorFromToken(token: string): Rgb {
  const swatch = document.createElement("canvas");
  const context = swatch.getContext("2d")!;
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue];
}

export function classificationColorScale(): FieldColorScale {
  const classA = colorFromToken("--classification-a");
  const classB = colorFromToken("--classification-b");

  return (value) => [
    Math.round(classA[0] + (classB[0] - classA[0]) * value),
    Math.round(classA[1] + (classB[1] - classA[1]) * value),
    Math.round(classA[2] + (classB[2] - classA[2]) * value),
  ];
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

export function drawField(
  canvas: HTMLCanvasElement,
  field: ScalarField,
  colorScale: FieldColorScale,
  size: Size,
): void {
  const context = resizeCanvas(canvas, size);
  const rows = field.values.length;
  const columns = field.values[0]?.length ?? 0;
  if (!context || rows === 0 || columns === 0) {
    return;
  }

  const image = context.createImageData(columns, rows);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const [red, green, blue] = colorScale(field.values[row][column]);
      const index = (row * columns + column) * 4;
      image.data[index] = red;
      image.data[index + 1] = green;
      image.data[index + 2] = blue;
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
