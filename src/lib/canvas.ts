import type { ScalarField } from "@/lib/field";

type Size = {
  width: number;
  height: number;
};

type Rgb = [number, number, number];

const CLASSIFICATION_BOUNDARY_WIDTH = 0.08;

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
  const boundary: Rgb = [242, 242, 242];
  const boundaryStart = 0.5 - CLASSIFICATION_BOUNDARY_WIDTH / 2;
  const boundaryEnd = 0.5 + CLASSIFICATION_BOUNDARY_WIDTH / 2;

  return (value) => {
    const normalized = Math.min(1, Math.max(0, value));

    if (normalized >= boundaryStart && normalized <= boundaryEnd) {
      return boundary;
    }

    const [from, to, progress] =
      normalized < boundaryStart
        ? [classA, boundary, normalized / boundaryStart]
        : [boundary, classB, (normalized - boundaryEnd) / (1 - boundaryEnd)];

    return [
      Math.round(from[0] + (to[0] - from[0]) * progress),
      Math.round(from[1] + (to[1] - from[1]) * progress),
      Math.round(from[2] + (to[2] - from[2]) * progress),
    ];
  };
}

export function activationFieldDataUrl(field: ScalarField): string {
  const rows = field.values.length;
  const columns = field.values[0]?.length ?? 0;
  const canvas = document.createElement("canvas");
  canvas.width = columns;
  canvas.height = rows;

  const context = canvas.getContext("2d");
  if (!context || rows === 0 || columns === 0) {
    return "";
  }

  const positive = colorFromToken("--classification-b");
  const negative = colorFromToken("--classification-a");
  const maxMagnitude = Math.max(
    1e-6,
    ...field.values.flatMap((row) => row.map((value) => Math.abs(value))),
  );
  const image = context.createImageData(columns, rows);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const value = field.values[row][column];
      const color = value >= 0 ? positive : negative;
      const index = (row * columns + column) * 4;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = Math.round((0.12 + (Math.abs(value) / maxMagnitude) * 0.88) * 255);
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function resizeCanvas(canvas: HTMLCanvasElement, size: Size): CanvasRenderingContext2D | null {
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size.width * dpr);
  canvas.height = Math.round(size.height * dpr);
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
