/**
 * Abstract Syntax Tree types for Weft specifications.
 */

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Node {
  kind: string;
  range: Range;
}

// ============================================
// Top-level declarations
// ============================================

export type Declaration =
  | RuleDeclaration
  | DefinitionDeclaration
  | DecisionDeclaration
  | OpenQuestionDeclaration
  | TypeDeclaration
  | ServiceDeclaration
  | EnumDeclaration
  | ViewDeclaration;

export interface Document extends Node {
  kind: "Document";
  declarations: Declaration[];
}

// ============================================
// Annotations (top-level)
// ============================================

export interface RuleDeclaration extends Node {
  kind: "Rule";
  id: string;
  prose: string;
}

export interface DefinitionDeclaration extends Node {
  kind: "Definition";
  id: string;
  prose: string;
}

export interface DecisionDeclaration extends Node {
  kind: "Decision";
  id: string;
  prose: string;
}

export interface OpenQuestionDeclaration extends Node {
  kind: "OpenQuestion";
  id: string;
  prose: string;
}

// ============================================
// Type-attached annotations
// ============================================

export interface ImplementsAnnotation extends Node {
  kind: "Implements";
  ruleId: string;
}

export interface SeeAnnotation extends Node {
  kind: "See";
  target: string;
}

export type TypeAnnotation = ImplementsAnnotation | SeeAnnotation;

// ============================================
// Type declarations
// ============================================

export type TypeKeyword = "type" | "struct" | "data" | "protocol" | "interface";

export interface TypeDeclaration extends Node {
  kind: "TypeDeclaration";
  keyword: TypeKeyword;
  name: string;
  docstring?: string;
  annotations: TypeAnnotation[];
  members: Member[];
}

export interface ServiceDeclaration extends Node {
  kind: "ServiceDeclaration";
  name: string;
  docstring?: string;
  annotations: TypeAnnotation[];
  methods: Method[];
}

export interface EnumDeclaration extends Node {
  kind: "EnumDeclaration";
  name: string;
  docstring?: string;
  cases: EnumCase[];
}

export interface ViewDeclaration extends Node {
  kind: "ViewDeclaration";
  name: string;
  docstring?: string;
  members: Member[];
}

// ============================================
// Members
// ============================================

export type Member = Field | Method;

export interface Field extends Node {
  kind: "Field";
  name: string;
  docstring?: string;
  type: TypeExpr;
  defaultValue?: Literal;
}

export interface Method extends Node {
  kind: "Method";
  name: string;
  docstring?: string;
  parameters: Parameter[];
  returnType?: TypeExpr;
  throws: boolean;
  throwsType?: TypeExpr;
}

export interface Parameter extends Node {
  kind: "Parameter";
  name: string;
  type: TypeExpr;
  defaultValue?: Literal;
}

export interface EnumCase extends Node {
  kind: "EnumCase";
  name: string;
  docstring?: string;
  associatedValues?: Parameter[];
}

// ============================================
// Types
// ============================================

export type TypeExpr =
  | PrimitiveType
  | NamedType
  | ArrayType
  | DictionaryType
  | OptionalType;

export interface PrimitiveType extends Node {
  kind: "PrimitiveType";
  name: string;
}

export interface NamedType extends Node {
  kind: "NamedType";
  name: string;
}

export interface ArrayType extends Node {
  kind: "ArrayType";
  elementType: TypeExpr;
}

export interface DictionaryType extends Node {
  kind: "DictionaryType";
  keyType: TypeExpr;
  valueType: TypeExpr;
}

export interface OptionalType extends Node {
  kind: "OptionalType";
  innerType: TypeExpr;
}

// ============================================
// Literals
// ============================================

export type Literal =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral;

export interface StringLiteral extends Node {
  kind: "StringLiteral";
  value: string;
}

export interface NumberLiteral extends Node {
  kind: "NumberLiteral";
  value: number;
}

export interface BooleanLiteral extends Node {
  kind: "BooleanLiteral";
  value: boolean;
}

export interface NullLiteral extends Node {
  kind: "NullLiteral";
}

export interface ArrayLiteral extends Node {
  kind: "ArrayLiteral";
  elements: Literal[];
}

// ============================================
// Helpers
// ============================================

export const PRIMITIVES = new Set([
  "string",
  "int",
  "float",
  "double",
  "bool",
  "date",
  "datetime",
  "url",
  "void",
  "any",
]);

export function isPrimitive(name: string): boolean {
  return PRIMITIVES.has(name);
}
