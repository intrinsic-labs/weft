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

// Clean Architecture role annotation
export type RoleKind =
  | "entity"
  | "usecase"
  | "repository"
  | "service"
  | "viewmodel"
  | "gateway"
  | "dto"
  | "adapter";

export interface RoleAnnotation extends Node {
  kind: "Role";
  role: RoleKind;
}

// Lifecycle scope annotation
export type LifecycleKind = "singleton" | "session" | "feature" | "view";

export interface LifecycleAnnotation extends Node {
  kind: "Lifecycle";
  scope: LifecycleKind;
}

// Schema annotation for persistence
export interface SchemaAnnotation extends Node {
  kind: "Schema";
}

export type TypeAnnotation =
  | ImplementsAnnotation
  | SeeAnnotation
  | RoleAnnotation
  | LifecycleAnnotation
  | SchemaAnnotation;

// ============================================
// Field-level annotations (for schema)
// ============================================

export interface IdAnnotation extends Node {
  kind: "Id";
  generated: boolean;
}

export interface UniqueAnnotation extends Node {
  kind: "Unique";
}

export interface IndexAnnotation extends Node {
  kind: "Index";
}

export interface RequiredAnnotation extends Node {
  kind: "Required";
}

export type FieldAnnotation = IdAnnotation | UniqueAnnotation | IndexAnnotation | RequiredAnnotation;

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
  annotations: FieldAnnotation[];
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

// ============================================
// Clean Architecture Helpers
// ============================================

/**
 * Role layers from innermost (0) to outermost (3).
 * Inner layers cannot depend on outer layers.
 */
export const ROLE_LAYERS: Record<RoleKind, number> = {
  entity: 0,      // Enterprise Business Rules (innermost)
  usecase: 1,     // Application Business Rules
  repository: 2,  // Interface Adapters (interfaces)
  service: 2,     // Interface Adapters (interfaces)
  viewmodel: 2,   // Interface Adapters
  gateway: 2,     // Interface Adapters
  dto: 2,         // Interface Adapters
  adapter: 3,     // Frameworks & Drivers (outermost)
};

/**
 * Lifecycle scopes from longest (0) to shortest (3).
 * Longer-lived scopes can inject into shorter-lived, not vice versa.
 */
export const LIFECYCLE_ORDER: Record<LifecycleKind, number> = {
  singleton: 0,
  session: 1,
  feature: 2,
  view: 3,
};

export function canDependOn(fromRole: RoleKind, toRole: RoleKind): boolean {
  // Inner layers can only depend on same or more inner layers
  return ROLE_LAYERS[fromRole] >= ROLE_LAYERS[toRole];
}

export function canInjectInto(fromScope: LifecycleKind, toScope: LifecycleKind): boolean {
  // Longer-lived can inject into shorter-lived
  return LIFECYCLE_ORDER[fromScope] <= LIFECYCLE_ORDER[toScope];
}
