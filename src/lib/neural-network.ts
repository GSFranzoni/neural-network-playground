import z from "zod";

export type Vector = number[];

export type Matrix = Vector[];

export interface Layer {
  forward(input: Vector): Vector;
  backward(gradient: Vector): Vector;
  parameters(): readonly Parameter[];
}

export interface Parameter {
  readonly values: Vector;
  readonly gradients: Vector;
}

export class InputLayer implements Layer {
  readonly size: number;

  constructor(size: number) {
    this.size = size;
  }

  forward(input: Vector): Vector {
    return input;
  }

  backward(gradient: Vector): Vector {
    return gradient;
  }

  parameters(): Parameter[] {
    return [];
  }
}

export class LinearLayer implements Layer {
  forward(input: Vector): Vector {
    return input;
  }

  backward(gradient: Vector): Vector {
    return gradient;
  }

  parameters(): Parameter[] {
    return [];
  }
}

export class ReLULayer implements Layer {
  private input: Vector = [];

  forward(input: Vector): Vector {
    this.input = input;

    return input.map((x) => Math.max(0, x));
  }

  backward(gradient: Vector): Vector {
    return gradient.map((value, i) => (this.input[i] > 0 ? value : 0));
  }

  parameters(): Parameter[] {
    return [];
  }
}

export class TanhLayer implements Layer {
  private output: Vector = [];

  forward(input: Vector): Vector {
    this.output = input.map(Math.tanh);
    return this.output;
  }

  backward(gradient: Vector): Vector {
    return gradient.map((value, index) => value * (1 - this.output[index] ** 2));
  }

  parameters(): Parameter[] {
    return [];
  }
}

export class SigmoidLayer implements Layer {
  private output: Vector = [];

  forward(input: Vector): Vector {
    this.output = input.map((value) => 1 / (1 + Math.exp(-value)));
    return this.output;
  }

  backward(gradient: Vector): Vector {
    return gradient.map((value, index) => value * this.output[index] * (1 - this.output[index]));
  }

  parameters(): Parameter[] {
    return [];
  }
}

export class DenseLayer implements Layer {
  readonly weights: Matrix;

  readonly biases: Vector;

  readonly weightGradients: Matrix;

  readonly biasGradients: Vector;

  readonly inputSize: number;

  readonly outputSize: number;

  private input: Vector = [];

  constructor(inputSize: number, outputSize: number) {
    this.weights = randomWeights(inputSize, outputSize);
    this.biases = Array(outputSize).fill(0);
    this.weightGradients = Array.from({ length: outputSize }, () => Array(inputSize).fill(0));
    this.biasGradients = Array(outputSize).fill(0);
    this.inputSize = inputSize;
    this.outputSize = outputSize;
  }

  forward(input: Vector): Vector {
    this.input = input;

    const output = Array(this.outputSize).fill(0);

    for (let j = 0; j < this.outputSize; j++) {
      let sum = this.biases[j];

      for (let i = 0; i < this.inputSize; i++) {
        sum += this.weights[j][i] * input[i];
      }

      output[j] = sum;
    }

    return output;
  }

  backward(outputGradient: Vector): Vector {
    const inputGradient = Array(this.inputSize).fill(0);

    for (let j = 0; j < this.outputSize; j++) {
      // ∂L/∂b_j
      this.biasGradients[j] = outputGradient[j];

      for (let i = 0; i < this.inputSize; i++) {
        // ∂L/∂W_ji = ∂L/∂y_j * x_i
        this.weightGradients[j][i] = outputGradient[j] * this.input[i];

        // ∂L/∂x_i += ∂L/∂y_j * W_ji
        inputGradient[i] += outputGradient[j] * this.weights[j][i];
      }
    }

    return inputGradient;
  }

  parameters(): readonly Parameter[] {
    return [
      ...this.weights.map((values, i) => ({
        values,
        gradients: this.weightGradients[i],
      })),
      {
        values: this.biases,
        gradients: this.biasGradients,
      },
    ];
  }
}

export class OutputLayer extends DenseLayer {}

export interface Optimizer {
  step(parameters: readonly Parameter[]): void;
}

export class SGD implements Optimizer {
  private readonly learningRate: number;

  constructor(learningRate: number) {
    this.learningRate = learningRate;
  }

  step(parameters: readonly Parameter[]): void {
    for (const { values, gradients } of parameters) {
      for (let i = 0; i < values.length; i++) {
        values[i] -= this.learningRate * gradients[i];
      }
    }
  }
}

export function randomWeights(inputSize: number, outputSize: number): Matrix {
  const standardDeviation = Math.sqrt(2 / inputSize);

  return Array.from({ length: outputSize }, () =>
    Array.from({ length: inputSize }, () => randomNormal() * standardDeviation),
  );
}

function randomNormal(): number {
  const u = Math.max(Math.random(), Number.MIN_VALUE);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

const WeightsSchema = z.array(z.array(z.number()));

export class NeuralNetwork implements Layer {
  readonly layers: Layer[] = [];

  constructor(layers: Layer[]) {
    this.layers = layers;
  }

  export() {
    return this.parameters().map((parameter) => [...parameter.values]);
  }

  load(raw: any): void {
    const state = WeightsSchema.safeParse(raw);

    if (state.error) {
      return;
    }

    const parameters = this.parameters();

    for (let i = 0; i < parameters.length; i++) {
      parameters[i].values.splice(0, parameters[i].values.length, ...state.data[i]);
    }
  }

  forward(input: Vector): Vector {
    return this.layers.reduce((input, layer) => layer.forward(input), input);
  }

  backward(gradient: Vector): Vector {
    return this.layers.reduceRight((gradient, layer) => layer.backward(gradient), gradient);
  }

  parameters(): readonly Parameter[] {
    return this.layers.flatMap((layer) => layer.parameters());
  }
}

export interface LossResult {
  loss: number;
  gradient: Vector;
}

export function softmax(logits: Vector): Vector {
  const maxLogit = Math.max(...logits);

  const exps = logits.map((logit) => Math.exp(logit - maxLogit));

  const sum = exps.reduce((acc, value) => acc + value, 0);

  return exps.map((value) => value / sum);
}

export function softmaxCrossEntropy(logits: Vector, target: number): LossResult {
  const probabilities = softmax(logits);

  const loss = -Math.log(probabilities[target]);

  const gradient = probabilities.map((probability, index) =>
    index === target ? probability - 1 : probability,
  );

  return {
    loss,
    gradient,
  };
}

export function binaryCrossEntropy(logit: number, target: number): LossResult {
  const probability = 1 / (1 + Math.exp(-logit));
  const clampedProbability = Math.min(Math.max(probability, 1e-7), 1 - 1e-7);

  return {
    loss: -(
      target * Math.log(clampedProbability) +
      (1 - target) * Math.log(1 - clampedProbability)
    ),
    gradient: [probability - target],
  };
}

export function argmax(values: Vector): number {
  let maxIndex = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[maxIndex]) {
      maxIndex = i;
    }
  }

  return maxIndex;
}

export class TrainingAudit {
  private totalLoss = 0;

  private correct = 0;

  private samples = 0;

  record(logits: Vector, label: number, loss: number) {
    this.totalLoss += loss;
    this.samples++;

    if (argmax(logits) === label) {
      this.correct++;
    }
  }

  shouldReport(every = 1000) {
    return this.samples % every === 0;
  }

  snapshot() {
    return {
      samples: this.samples,
      loss: this.totalLoss / this.samples,
      accuracy: this.correct / this.samples,
    };
  }
}
