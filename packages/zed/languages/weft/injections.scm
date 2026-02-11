; Inject Markdown highlighting into Weft docstrings/prose blocks.
((docstring) @injection.content
  (#offset! @injection.content 0 3 0 -3)
  (#set! injection.language "markdown"))
