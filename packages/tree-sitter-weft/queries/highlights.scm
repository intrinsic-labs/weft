; Keywords
[
  "type"
  "struct"
  "data"
  "protocol"
  "interface"
  "service"
  "view"
  "enum"
  "func"
  "throws"
] @keyword

; Primitive types
(primitive_type) @type.builtin

; Type identifiers
(type_identifier) @type

; Annotations
[
  "@Rule"
  "@Definition"
  "@Decision"
  "@OpenQuestion"
  "@Role"
  "@Lifecycle"
  "@Implements"
  "@See"
  "@Schema"
  "@Id"
  "@Unique"
  "@Index"
  "@Required"
] @attribute

; Role and lifecycle kinds
(role_kind) @constant

(lifecycle_kind) @constant

; Type/service/enum/view names
(type_declaration
  name: (identifier) @type.definition)

(service_declaration
  name: (identifier) @type.definition)

(enum_declaration
  name: (identifier) @type.definition)

(view_declaration
  name: (identifier) @type.definition)

; Enum cases
(enum_case
  name: (identifier) @constant)

; Field names
(field
  name: (identifier) @property)

; Method names
(method
  name: (identifier) @function)

; Parameter names
(parameter
  name: (identifier) @variable.parameter)

; Strings
(string) @string

; Docstrings
(docstring) @string.documentation

; Numbers
(number) @number

; Booleans
(boolean) @constant.builtin

; Null
(null) @constant.builtin

; Comments
(line_comment) @comment
(block_comment) @comment

; Punctuation
[
  "{"
  "}"
  "["
  "]"
  "("
  ")"
] @punctuation.bracket

[
  ":"
  ","
  "->"
  "?"
  "="
] @punctuation.delimiter
