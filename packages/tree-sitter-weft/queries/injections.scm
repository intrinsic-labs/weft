; Inject Markdown highlighting into Weft docstrings/prose blocks.
((docstring
   (docstring_content) @injection.content)
  (#set! injection.language "markdown"))
