package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Config is read from a file the host controls (never from the extension), so
// the set of writable destinations cannot be widened by a compromised add-on.
type Config struct {
	AllowedRoots []string `json:"allowedRoots"`
}

func configPath() string {
	if path := os.Getenv("DOWNLOAD_ROUTER_CONFIG"); path != "" {
		return path
	}
	if exe, err := os.Executable(); err == nil {
		return filepath.Join(filepath.Dir(exe), "config.json")
	}
	return "config.json"
}

func loadConfig() (Config, error) {
	data, err := os.ReadFile(configPath())
	if err != nil {
		if os.IsNotExist(err) {
			return defaultConfig()
		}
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, fmt.Errorf("invalid config: %w", err)
	}
	if len(cfg.AllowedRoots) == 0 {
		return defaultConfig()
	}
	return normalizeConfig(cfg)
}

func defaultConfig() (Config, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return Config{}, err
	}
	return normalizeConfig(Config{AllowedRoots: []string{home}})
}

func normalizeConfig(cfg Config) (Config, error) {
	roots := make([]string, 0, len(cfg.AllowedRoots))
	for _, root := range cfg.AllowedRoots {
		abs, err := filepath.Abs(expandHome(root))
		if err != nil {
			return Config{}, err
		}
		// Resolve symlinks on roots so they compare correctly against the
		// symlink-resolved destination during validation.
		if resolved, err := filepath.EvalSymlinks(abs); err == nil {
			abs = resolved
		}
		roots = append(roots, abs)
	}
	return Config{AllowedRoots: roots}, nil
}

func expandHome(path string) string {
	if path != "~" && !strings.HasPrefix(path, "~/") {
		return path
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return path
	}
	return filepath.Join(home, strings.TrimPrefix(path, "~"))
}
