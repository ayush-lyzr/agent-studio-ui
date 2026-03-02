/**
 * Gradient Generation Utilities
 * Following SOLID principles: Single Responsibility, Open/Closed, Interface Segregation
 */

// Interface for gradient configuration (Interface Segregation Principle)
export interface GradientConfig {
  colors: [string, string];
  direction: number;
  type: "linear" | "radial";
}

// Interface for gradient generator (Dependency Inversion Principle)
export interface IGradientGenerator {
  generateFromString(input: string): GradientConfig;
}

// Hash generator class (Single Responsibility Principle)
class StringHasher {
  /**
   * Simple hash function to convert string to consistent number
   * Uses djb2 algorithm for good distribution
   */
  static hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  /**
   * Generate multiple hash values from a string
   */
  static multiHash(str: string, count: number): number[] {
    const results: number[] = [];
    let current = str;

    for (let i = 0; i < count; i++) {
      const hash = this.hash(current);
      results.push(hash);
      current = current + i; // Modify for next iteration
    }

    return results;
  }
}

// Color palette manager (Single Responsibility Principle)
class ColorPalette {
  private static readonly COLORS = [
    "gradient-pink",
    "gradient-purple",
    "gradient-blue",
    "gradient-cyan",
    "gradient-teal",
    "gradient-green",
    "gradient-lime",
    "gradient-yellow",
    "gradient-orange",
    "gradient-red",
    "gradient-violet",
    "gradient-indigo",
  ] as const;

  private static readonly DARK_COLORS = [
    "gradient-pink-dark",
    "gradient-purple-dark",
    "gradient-blue-dark",
    "gradient-cyan-dark",
    "gradient-teal-dark",
    "gradient-green-dark",
    "gradient-lime-dark",
    "gradient-yellow-dark",
    "gradient-orange-dark",
    "gradient-red-dark",
    "gradient-violet-dark",
    "gradient-indigo-dark",
  ] as const;

  static getColorByIndex(index: number, useDark = false): string {
    const colors = useDark ? this.DARK_COLORS : this.COLORS;
    return colors[index % colors.length];
  }

  static getColorCount(): number {
    return this.COLORS.length;
  }
}

// Direction calculator (Single Responsibility Principle)
class DirectionCalculator {
  private static readonly DIRECTIONS = [0, 45, 90, 135, 180, 225, 270, 315];

  static calculateDirection(hash: number): number {
    return this.DIRECTIONS[hash % this.DIRECTIONS.length];
  }
}

// Main gradient generator implementing the interface (Open/Closed Principle)
export class DefaultGradientGenerator implements IGradientGenerator {
  /**
   * Generates a consistent gradient configuration from a string input
   * Same string will always produce the same gradient
   */
  generateFromString(input: string): GradientConfig {
    const hashes = StringHasher.multiHash(input, 4);

    // Use different hash values for different properties
    const colorIndex1 = hashes[0] % ColorPalette.getColorCount();
    const colorIndex2 = hashes[1] % ColorPalette.getColorCount();
    const direction = DirectionCalculator.calculateDirection(hashes[2]);
    const type: "linear" | "radial" = "radial";

    // Ensure colors are different
    const adjustedColorIndex2 =
      colorIndex1 === colorIndex2
        ? (colorIndex2 + 1) % ColorPalette.getColorCount()
        : colorIndex2;

    // Mix light and dark variants for better contrast
    const useDarkForFirst = hashes[0] % 2 === 0;
    const useDarkForSecond = hashes[1] % 2 === 1;

    const color1 = ColorPalette.getColorByIndex(colorIndex1, useDarkForFirst);
    const color2 = ColorPalette.getColorByIndex(
      adjustedColorIndex2,
      useDarkForSecond,
    );

    return {
      colors: [color1, color2],
      direction,
      type,
    };
  }
}

// Performance optimization with memoization (Single Responsibility Principle)
export class MemoizedGradientGenerator implements IGradientGenerator {
  private cache = new Map<string, GradientConfig>();
  private generator: IGradientGenerator;

  constructor(generator: IGradientGenerator = new DefaultGradientGenerator()) {
    this.generator = generator;
  }

  generateFromString(input: string): GradientConfig {
    if (this.cache.has(input)) {
      return this.cache.get(input)!;
    }

    const config = this.generator.generateFromString(input);
    this.cache.set(input, config);

    // Prevent memory leaks by limiting cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (typeof firstKey === "string") {
        this.cache.delete(firstKey);
      }
    }

    return config;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Factory for creating gradient generators (Factory Pattern)
export class GradientGeneratorFactory {
  static createDefault(): IGradientGenerator {
    return new MemoizedGradientGenerator();
  }

  static createWithCustomGenerator(
    generator: IGradientGenerator,
  ): IGradientGenerator {
    return new MemoizedGradientGenerator(generator);
  }
}
