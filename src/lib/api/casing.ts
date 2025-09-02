/** biome-ignore-all lint/suspicious/noExplicitAny: could be anything */
type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelCaseKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamelCase<K> : K]: T[K];
};

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Capitalize<U>
    ? `${T}_${Lowercase<U>}${CamelToSnakeCase<Uncapitalize<U>>}`
    : `${T}${CamelToSnakeCase<U>}`
  : S;

type SnakeCaseKeys<T> = {
  [K in keyof T as K extends string ? CamelToSnakeCase<K> : K]: T[K];
};

/**
 * Converts objects and arrays of objects from snake case to camel case
 * @param obj
 * @returns
 */
export function toCamelCase<T extends Record<string, any> | any[]>(
  obj: T,
): T extends any[] ? CamelCaseKeys<T[0]>[] : CamelCaseKeys<T> {
  if (!obj || typeof obj !== "object") {
    return obj as any;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as any;
  }

  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }

  return result;
}

/**
 * Converts objects and arrays of objects from camel case to snake case
 * @param obj
 * @returns
 */
export function toSnakeCase<T extends Record<string, any> | any[]>(
  obj: T,
): T extends any[] ? SnakeCaseKeys<T[0]>[] : SnakeCaseKeys<T> {
  if (!obj || typeof obj !== "object") {
    return obj as any;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as any;
  }

  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }

  return result;
}
