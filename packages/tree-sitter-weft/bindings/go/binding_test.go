package tree_sitter_weft_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-weft"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_weft.Language())
	if language == nil {
		t.Errorf("Error loading Weft grammar")
	}
}
