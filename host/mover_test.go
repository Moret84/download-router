package main

import (
	"os"
	"path/filepath"
	"testing"
)

// tempRoot returns a symlink-resolved temp directory, matching how the host
// normalizes configured roots.
func tempRoot(t *testing.T) string {
	t.Helper()
	root, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return root
}

func TestValidateDestinationWithinRoot(t *testing.T) {
	root := tempRoot(t)
	dest := filepath.Join(root, "sub", "file.txt")
	got, err := validateDestination(dest, []string{root})
	if err != nil {
		t.Fatalf("expected destination allowed, got error: %v", err)
	}
	if got != filepath.Clean(dest) {
		t.Fatalf("unexpected clean path: %s", got)
	}
}

func TestValidateDestinationOutsideRoot(t *testing.T) {
	root := tempRoot(t)
	other := tempRoot(t)
	if _, err := validateDestination(filepath.Join(other, "file.txt"), []string{root}); err == nil {
		t.Fatal("expected destination outside root to be rejected")
	}
}

func TestValidateDestinationRejectsTraversal(t *testing.T) {
	root := tempRoot(t)
	dest := filepath.Join(root, "..", "escape.txt")
	if _, err := validateDestination(dest, []string{root}); err == nil {
		t.Fatal("expected path traversal to be rejected")
	}
}

func TestMoveFileUniquifies(t *testing.T) {
	root := tempRoot(t)
	source := filepath.Join(root, "src.txt")
	if err := os.WriteFile(source, []byte("data"), 0o644); err != nil {
		t.Fatal(err)
	}
	dest := filepath.Join(root, "dst", "file.txt")
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(dest, []byte("existing"), 0o644); err != nil {
		t.Fatal(err)
	}

	final, err := moveFile(source, dest, []string{root})
	if err != nil {
		t.Fatalf("moveFile failed: %v", err)
	}
	if final == dest {
		t.Fatal("expected a uniquified destination, got the existing path")
	}
	if _, err := os.Stat(final); err != nil {
		t.Fatalf("moved file missing: %v", err)
	}
	if _, err := os.Stat(source); !os.IsNotExist(err) {
		t.Fatal("source should no longer exist after move")
	}
}
