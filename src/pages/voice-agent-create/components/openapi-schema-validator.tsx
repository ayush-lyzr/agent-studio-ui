interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

type SchemaType =
  | "string"
  | "number"
  | "boolean"
  | "integer"
  | "object"
  | "array"
  | "null";

interface JSONSchema {
  type?: SchemaType | SchemaType[];
  properties?: { [key: string]: JSONSchema };
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  items?: JSONSchema;
  enum?: JSONValue[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  anyOf?: JSONSchema[];
  description?: string;
  [key: string]: any;
}

class OpenAISchemaValidator {
  private static readonly SUPPORTED_TYPES: Set<SchemaType> = new Set([
    "string",
    "number",
    "boolean",
    "integer",
    "object",
    "array",
  ]);

  private static readonly SUPPORTED_STRING_FORMATS: Set<string> = new Set([
    "date-time",
    "time",
    "date",
    "duration",
    "email",
    "hostname",
    "ipv4",
    "ipv6",
    "uuid",
  ]);

  private static readonly SUPPORTED_STRING_PROPS: Set<string> = new Set([
    "pattern",
    "format",
  ]);

  private static readonly SUPPORTED_NUMBER_PROPS: Set<string> = new Set([
    "multipleOf",
    "maximum",
    "exclusiveMaximum",
    "minimum",
    "exclusiveMinimum",
  ]);

  private static readonly SUPPORTED_ARRAY_PROPS: Set<string> = new Set([
    "minItems",
    "maxItems",
  ]);

  private static readonly MAX_NESTING = 10;
  private static readonly MAX_ENUM_VALUES = 1000;
  private static readonly MAX_ENUM_STRING_LENGTH_TOTAL = 15000;
  private static readonly MAX_TOTAL_STRING_SIZE = 120000;

  private errors: string[] = [];

  public validate(schema: JSONSchema): ValidationResult {
    // Reset state for new validation
    this.errors = [];

    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      return {
        isValid: false,
        errors: ["Schema must be a non-empty object"],
      };
    }

    // Root checks
    if (schema.type !== "object") {
      this.errors.push("$.type must be 'object'");
    }
    if (schema.additionalProperties !== false) {
      this.errors.push("$.additionalProperties must be false");
    }
    if (schema.properties) {
      this.checkObject(schema, 1, "$");
    }

    // Total string length check
    if (
      this.calculateStringSize(schema) >
      OpenAISchemaValidator.MAX_TOTAL_STRING_SIZE
    ) {
      this.errors.push(
        `Total string size exceeds ${OpenAISchemaValidator.MAX_TOTAL_STRING_SIZE}`,
      );
    }

    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
    };
  }

  private checkObject(
    obj: JSONSchema,
    depth: number = 1,
    path: string = "$",
  ): void {
    if (depth > OpenAISchemaValidator.MAX_NESTING) {
      this.errors.push(
        `${path}: Nesting depth exceeds ${OpenAISchemaValidator.MAX_NESTING}`,
      );
    }

    if (obj.type !== "object") {
      this.errors.push(`${path}: Root or sub-schema must be an object type`);
    }

    // Check additionalProperties
    if (obj.additionalProperties !== false) {
      this.errors.push(`${path}: 'additionalProperties' must be false`);
    }

    // Ensure all fields are required
    const props = obj.properties || {};
    const reqs = obj.required || [];
    const propKeys = new Set(Object.keys(props));
    const reqKeys = new Set(reqs);

    if (
      propKeys.size !== reqKeys.size ||
      ![...propKeys].every((key) => reqKeys.has(key))
    ) {
      this.errors.push(`${path}: All properties must be listed in 'required'`);
    }

    for (const [propName, propSchema] of Object.entries(props)) {
      this.checkProperty(propSchema, depth + 1, `${path}.${propName}`);
    }
  }

  private checkProperty(prop: JSONSchema, depth: number, path: string): void {
    // Handle anyOf
    if (prop.anyOf) {
      if (!Array.isArray(prop.anyOf)) {
        this.errors.push(`${path}: 'anyOf' must be a list`);
      } else {
        for (let idx = 0; idx < prop.anyOf.length; idx++) {
          const variant = prop.anyOf[idx];
          if (
            !variant ||
            typeof variant !== "object" ||
            Array.isArray(variant)
          ) {
            this.errors.push(`${path}.anyOf[${idx}]: Must be a dict schema`);
          } else {
            if (variant.type === "object") {
              this.checkObject(variant, depth + 1, `${path}.anyOf[${idx}]`);
            } else {
              this.checkProperty(variant, depth + 1, `${path}.anyOf[${idx}]`);
            }
          }
        }
      }
      return;
    }

    const t = prop.type;
    if (Array.isArray(t)) {
      // Allow null in union
      const allowed = new Set(t.filter((type) => type !== "null"));
      if (
        ![...allowed].every((type) =>
          OpenAISchemaValidator.SUPPORTED_TYPES.has(type),
        )
      ) {
        this.errors.push(
          `${path}: Unsupported type(s) in ${JSON.stringify(t)}`,
        );
      }
    } else {
      if (t && !OpenAISchemaValidator.SUPPORTED_TYPES.has(t) && t !== "null") {
        this.errors.push(`${path}: Unsupported type '${t}'`);
      }
    }

    // Type-specific checks
    if (t === "string") {
      const allowedStringKeys = new Set([
        ...OpenAISchemaValidator.SUPPORTED_STRING_PROPS,
        "type",
        "description",
        "enum",
        "pattern",
        "format",
      ]);

      for (const key of Object.keys(prop)) {
        if (OpenAISchemaValidator.SUPPORTED_STRING_PROPS.has(key)) {
          if (
            key === "format" &&
            prop[key] &&
            !OpenAISchemaValidator.SUPPORTED_STRING_FORMATS.has(
              prop[key] as string,
            )
          ) {
            this.errors.push(
              `${path}: Unsupported string format '${prop[key]}'`,
            );
          }
        } else if (!allowedStringKeys.has(key)) {
          this.errors.push(`${path}: Unsupported string property '${key}'`);
        }
      }
    } else if (t === "number") {
      const allowedNumberKeys = new Set([
        ...OpenAISchemaValidator.SUPPORTED_NUMBER_PROPS,
        "type",
        "description",
        "enum",
      ]);

      for (const key of Object.keys(prop)) {
        if (!allowedNumberKeys.has(key)) {
          this.errors.push(`${path}: Unsupported number property '${key}'`);
        }
      }
    } else if (t === "array") {
      const allowedArrayKeys = new Set([
        ...OpenAISchemaValidator.SUPPORTED_ARRAY_PROPS,
        "type",
        "description",
        "items",
      ]);

      for (const key of Object.keys(prop)) {
        if (!allowedArrayKeys.has(key)) {
          this.errors.push(`${path}: Unsupported array property '${key}'`);
        }
      }

      if (
        prop.items &&
        typeof prop.items === "object" &&
        !Array.isArray(prop.items)
      ) {
        this.checkProperty(prop.items, depth + 1, `${path}.items`);
      }
    } else if (t === "object") {
      this.checkObject(prop, depth, path);
    }

    // Enum checks
    if (prop.enum) {
      const enumVals = prop.enum;
      if (!Array.isArray(enumVals)) {
        this.errors.push(`${path}: enum must be a list`);
      } else {
        if (enumVals.length > OpenAISchemaValidator.MAX_ENUM_VALUES) {
          this.errors.push(
            `${path}: enum exceeds ${OpenAISchemaValidator.MAX_ENUM_VALUES} values`,
          );
        }

        if (
          enumVals.every((v) => typeof v === "string") &&
          enumVals.length > 250
        ) {
          const totalLen = enumVals.reduce(
            (sum, v) => sum + (v as string).length,
            0,
          );
          if (totalLen > OpenAISchemaValidator.MAX_ENUM_STRING_LENGTH_TOTAL) {
            this.errors.push(
              `${path}: enum string values exceed total length ${OpenAISchemaValidator.MAX_ENUM_STRING_LENGTH_TOTAL}`,
            );
          }
        }
      }
    }
  }

  private calculateStringSize(obj: any): number {
    let total = 0;

    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        total += k.length;
        total += this.calculateStringSize(v);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        total += this.calculateStringSize(item);
      }
    } else if (typeof obj === "string") {
      total += obj.length;
    }

    return total;
  }
}

// Convenience function
export function validateOpenAISchema(schema: JSONSchema): ValidationResult {
  return new OpenAISchemaValidator().validate(schema);
}

export { OpenAISchemaValidator };
export type { ValidationResult, JSONSchema };
