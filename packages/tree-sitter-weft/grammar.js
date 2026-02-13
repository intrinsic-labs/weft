/**
 * Tree-sitter grammar for Weft specification language.
 *
 * Weft is a structured specification language with types, services,
 * enums, views, and semantic annotations.
 */

module.exports = grammar({
  name: 'weft',

  // Disambiguate cases like:
  // enum X { """doc""" Case }
  // where the docstring could be interpreted as belonging to the enum body
  // or to the following enum_case.
  //
  // Also disambiguate method docstrings inside service bodies:
  // service S { """doc""" foo() }
  // where the docstring could be parsed as the service_body docstring
  // or the method docstring.
  conflicts: $ => [
    [$.enum_case],
    [$.method],
    [$.field],
  ],

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  rules: {
    // ========================================
    // Document
    // ========================================

    source_file: $ => repeat($._declaration),

    _declaration: $ => choice(
      $.rule_annotation,
      $.definition_annotation,
      $.decision_annotation,
      $.open_question_annotation,
      $.type_declaration,
      $.service_declaration,
      $.enum_declaration,
      $.view_declaration,
    ),

    // ========================================
    // Top-level Annotations
    // ========================================

    rule_annotation: $ => seq(
      '@Rule',
      '(',
      $.string,
      ',',
      $._prose,
      ')',
    ),

    definition_annotation: $ => seq(
      '@Definition',
      '(',
      $.string,
      ',',
      $._prose,
      ')',
    ),

    decision_annotation: $ => seq(
      '@Decision',
      '(',
      $.string,
      ',',
      $._prose,
      ')',
    ),

    open_question_annotation: $ => seq(
      '@OpenQuestion',
      '(',
      $.string,
      ',',
      $._prose,
      ')',
    ),

    _prose: $ => choice(
      $.string,
      $.docstring,
    ),

    // ========================================
    // Type-attached Annotations
    // ========================================

    _type_annotation: $ => choice(
      $.role_annotation,
      $.lifecycle_annotation,
      $.implements_annotation,
      $.see_annotation,
      $.schema_annotation,
      $.boundary_annotation,
      $.priority_annotation,
      $.todo_annotation,
    ),

    role_annotation: $ => seq(
      '@Role',
      '(',
      $.role_kind,
      ')',
    ),

    role_kind: $ => choice(
      'entity',
      'usecase',
      'repository',
      'service',
      'viewmodel',
      'gateway',
      'dto',
      'adapter',
    ),

    lifecycle_annotation: $ => seq(
      '@Lifecycle',
      '(',
      $.lifecycle_kind,
      ')',
    ),

    lifecycle_kind: $ => choice(
      'singleton',
      'session',
      'feature',
      'view',
    ),

    implements_annotation: $ => seq(
      '@Implements',
      '(',
      $.string,
      ')',
    ),

    see_annotation: $ => seq(
      '@See',
      '(',
      $.string,
      ')',
    ),

    schema_annotation: $ => seq(
      '@Schema',
    ),

    boundary_annotation: $ => seq(
      '@Boundary',
      '(',
      $.boundary_kind,
      optional(seq(',', $.string)),
      ')',
    ),

    boundary_kind: $ => choice(
      'api',
      'database',
      'db',
      'queue',
      'filesystem',
      'fs',
      'ui',
      'external',
    ),

    priority_annotation: $ => seq(
      '@Priority',
      '(',
      $.priority_level,
      ')',
    ),

    priority_level: $ => choice(
      'p0',
      'p1',
      'p2',
      'p3',
      'critical',
      'high',
      'medium',
      'low',
    ),

    todo_annotation: $ => seq(
      '@TODO',
      '(',
      $.string,
      optional(seq(',', $.todo_field, repeat(seq(',', $.todo_field)))),
      ')',
    ),

    todo_field: $ => choice(
      seq('id', ':', $.string),
      seq('owner', ':', $.string),
      seq('due', ':', $.string),
      seq('status', ':', $.todo_status),
      seq('priority', ':', $.priority_level),
    ),

    todo_status: $ => choice(
      'open',
      'in_progress',
      'blocked',
      'done',
    ),

    // ========================================
    // Field Annotations
    // ========================================

    _field_annotation: $ => choice(
      $.id_annotation,
      $.unique_annotation,
      $.index_annotation,
      $.required_annotation,
    ),

    id_annotation: $ => seq(
      '@Id',
      optional(seq(
        '(',
        $.identifier,
        ')',
      )),
    ),
    unique_annotation: $ => '@Unique',
    index_annotation: $ => '@Index',
    required_annotation: $ => '@Required',

    // ========================================
    // Type Declarations
    // ========================================

    type_declaration: $ => seq(
      repeat($._type_annotation),
      $._type_keyword,
      $.identifier,
      $.type_body,
    ),

    _type_keyword: $ => choice(
      'type',
      'struct',
      'data',
      'protocol',
      'interface',
    ),

    type_body: $ => seq(
      '{',
      optional($.docstring),
      repeat($._member),
      '}',
    ),

    _member: $ => choice(
      $.field,
      $.method,
    ),

    // ========================================
    // Service Declarations
    // ========================================

    service_declaration: $ => seq(
      repeat($._type_annotation),
      'service',
      $.identifier,
      $.service_body,
    ),

    service_body: $ => seq(
      '{',
      optional($.docstring),
      repeat($.method),
      '}',
    ),

    // ========================================
    // Enum Declarations
    // ========================================

    enum_declaration: $ => seq(
      repeat($._type_annotation),
      'enum',
      $.identifier,
      $.enum_body,
    ),

    enum_body: $ => seq(
      '{',
      optional($.docstring),
      repeat($.enum_case),
      '}',
    ),

    enum_case: $ => seq(
      optional($.docstring),
      $.identifier,
      optional($.associated_values),
    ),

    associated_values: $ => seq(
      '(',
      optional($.parameter_list),
      ')',
    ),

    // ========================================
    // View Declarations
    // ========================================

    view_declaration: $ => seq(
      repeat($._type_annotation),
      'view',
      $.identifier,
      $.view_body,
    ),

    view_body: $ => seq(
      '{',
      optional($.docstring),
      repeat($._member),
      '}',
    ),

    // ========================================
    // Fields
    // ========================================

    field: $ => seq(
      optional($.docstring),
      repeat($._field_annotation),
      $.identifier,
      ':',
      $._type,
      optional($.default_value),
    ),

    default_value: $ => seq(
      '=',
      $._literal,
    ),

    // ========================================
    // Methods
    // ========================================

    method: $ => seq(
      optional($.docstring),
      optional(choice('func', 'fn', 'function')),
      $.identifier,
      '(',
      optional($.parameter_list),
      ')',
      optional($.return_type),
      optional($.throws_clause),
    ),

    parameter_list: $ => seq(
      $.parameter,
      repeat(seq(',', $.parameter)),
      optional(','),
    ),

    parameter: $ => seq(
      $.identifier,
      ':',
      $._type,
      optional($.default_value),
    ),

    return_type: $ => seq(
      '->',
      $._type,
    ),

    throws_clause: $ => prec.right(seq(
      'throws',
      optional($._type),
    )),

    // ========================================
    // Types
    // ========================================

    _type: $ => choice(
      $.primitive_type,
      $.type_identifier,
      $.array_type,
      $.dictionary_type,
      $.optional_type,
    ),

    primitive_type: $ => choice(
      'string',
      'int',
      'float',
      'double',
      'bool',
      'date',
      'datetime',
      'url',
      'void',
      'any',
    ),

    type_identifier: $ => $.identifier,

    array_type: $ => seq(
      '[',
      $._type,
      ']',
    ),

    dictionary_type: $ => seq(
      '[',
      $._type,
      ':',
      $._type,
      ']',
    ),

    optional_type: $ => seq(
      choice(
        $.primitive_type,
        $.type_identifier,
        $.array_type,
        $.dictionary_type,
      ),
      '?',
    ),

    // ========================================
    // Literals
    // ========================================

    _literal: $ => choice(
      $.string,
      $.number,
      $.boolean,
      $.null,
      $.array_literal,
    ),

    string: $ => choice(
      seq('"', /[^"]*/, '"'),
      seq("'", /[^']*/, "'"),
    ),

    docstring: _ => token(choice(
      seq('"""', /([^"]|"[^"]|""[^"])*/, '"""'),
      seq("'''", /([^']|'[^']|''[^'])*/, "'''"),
    )),

    number: $ => /\d+(\.\d+)?/,

    boolean: $ => choice('true', 'false'),

    null: $ => 'null',

    array_literal: $ => seq(
      '[',
      optional(seq(
        $._literal,
        repeat(seq(',', $._literal)),
        optional(','),
      )),
      ']',
    ),

    // ========================================
    // Identifiers & Comments
    // ========================================

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    line_comment: $ => seq('//', /.*/),

    block_comment: $ => seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/',
    ),
  },
});
