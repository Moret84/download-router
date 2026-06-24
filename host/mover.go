package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func moveFile(source, destination string, allowedRoots []string) (string, error) {
	if source == "" {
		return "", fmt.Errorf("empty source")
	}
	info, err := os.Lstat(source)
	if err != nil {
		return "", fmt.Errorf("source not found: %w", err)
	}
	if !info.Mode().IsRegular() {
		return "", fmt.Errorf("source is not a regular file")
	}

	dest, err := validateDestination(destination, allowedRoots)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return "", err
	}
	final := uniquePath(dest)
	if err := renameOrCopy(source, final); err != nil {
		return "", err
	}
	return final, nil
}

func validateDestination(destination string, allowedRoots []string) (string, error) {
	if destination == "" {
		return "", fmt.Errorf("empty destination")
	}
	// The extension cannot know the user's home, so it sends "~" paths; the host
	// expands them. filepath.Abs does not, and would otherwise create a literal
	// "~" directory relative to the host's working directory.
	abs, err := filepath.Abs(expandHome(destination))
	if err != nil {
		return "", err
	}
	clean := filepath.Clean(abs)

	resolved := resolveExistingAncestor(clean)
	for _, root := range allowedRoots {
		if withinRoot(resolved, root) {
			return clean, nil
		}
	}
	return "", fmt.Errorf("destination is outside the allowed folders: %s", clean)
}

// resolveExistingAncestor resolves symlinks on the deepest existing ancestor of
// path and rejoins the not-yet-existing remainder. This prevents a symlinked
// intermediate directory from being used to escape an allowed root.
func resolveExistingAncestor(path string) string {
	remainder := ""
	current := path
	for {
		if resolved, err := filepath.EvalSymlinks(current); err == nil {
			return filepath.Join(resolved, remainder)
		}
		parent := filepath.Dir(current)
		if parent == current {
			return path
		}
		remainder = filepath.Join(filepath.Base(current), remainder)
		current = parent
	}
}

func withinRoot(path, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return false
	}
	return !filepath.IsAbs(rel)
}

// uniquePath never overwrites: if the target exists it inserts " (n)" before
// the extension until a free name is found.
func uniquePath(path string) string {
	if _, err := os.Lstat(path); os.IsNotExist(err) {
		return path
	}
	dir := filepath.Dir(path)
	base := filepath.Base(path)
	ext := filepath.Ext(base)
	stem := strings.TrimSuffix(base, ext)
	for counter := 1; ; counter++ {
		candidate := filepath.Join(dir, fmt.Sprintf("%s (%d)%s", stem, counter, ext))
		if _, err := os.Lstat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
}

func renameOrCopy(source, dest string) error {
	if err := os.Rename(source, dest); err == nil {
		return nil
	}
	// os.Rename fails across filesystem boundaries (EXDEV); fall back to copy.
	return copyAndRemove(source, dest)
}

func copyAndRemove(source, dest string) error {
	in, err := os.Open(source)
	if err != nil {
		return err
	}
	out, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		in.Close()
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		in.Close()
		os.Remove(dest)
		return err
	}
	if err := out.Close(); err != nil {
		in.Close()
		os.Remove(dest)
		return err
	}
	if err := in.Close(); err != nil {
		return err
	}
	return os.Remove(source)
}
