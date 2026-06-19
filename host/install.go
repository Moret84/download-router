package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	hostName    = "download_router"
	extensionID = "download-router@bosscorp.fr"
)

type hostManifest struct {
	Name              string   `json:"name"`
	Description       string   `json:"description"`
	Path              string   `json:"path"`
	Type              string   `json:"type"`
	AllowedExtensions []string `json:"allowed_extensions"`
}

func runInstall(system bool) error {
	self, err := selfPath()
	if err != nil {
		return err
	}

	if runtime.GOOS == "darwin" {
		// A binary downloaded from a release is quarantined and Firefox cannot
		// launch it; clear that flag best-effort.
		_ = exec.Command("xattr", "-d", "com.apple.quarantine", self).Run()
	}

	dir, err := manifestDir(system)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	manifestPath := filepath.Join(dir, hostName+".json")

	manifest := hostManifest{
		Name:              hostName,
		Description:       "Download Router native messaging host",
		Path:              self,
		Type:              "stdio",
		AllowedExtensions: []string{extensionID},
	}
	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(manifestPath, data, 0o644); err != nil {
		return err
	}

	if err := seedConfigNextTo(self); err != nil {
		return err
	}

	if runtime.GOOS == "windows" {
		if err := exec.Command("reg", "add", registryKey(system), "/ve", "/t", "REG_SZ", "/d", manifestPath, "/f").Run(); err != nil {
			return fmt.Errorf("registering native host in the registry: %w", err)
		}
	}

	fmt.Printf("Installed native host:\n  binary:   %s\n  manifest: %s\n", self, manifestPath)
	return nil
}

func runUninstall(system bool) error {
	dir, err := manifestDir(system)
	if err != nil {
		return err
	}
	if err := os.Remove(filepath.Join(dir, hostName+".json")); err != nil && !os.IsNotExist(err) {
		return err
	}
	if runtime.GOOS == "windows" {
		_ = exec.Command("reg", "delete", registryKey(system), "/f").Run()
	}
	fmt.Println("Removed native host registration.")
	return nil
}

func selfPath() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Abs(exe)
}

func manifestDir(system bool) (string, error) {
	switch runtime.GOOS {
	case "darwin":
		if system {
			return "/Library/Application Support/Mozilla/NativeMessagingHosts", nil
		}
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Library", "Application Support", "Mozilla", "NativeMessagingHosts"), nil
	case "linux":
		if system {
			return "/usr/lib/mozilla/native-messaging-hosts", nil
		}
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, ".mozilla", "native-messaging-hosts"), nil
	case "windows":
		base := os.Getenv("APPDATA")
		if system {
			base = os.Getenv("ProgramData")
		}
		if base == "" {
			return "", fmt.Errorf("cannot determine the manifest directory")
		}
		return filepath.Join(base, "download-router"), nil
	default:
		return "", fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}
}

func registryKey(system bool) string {
	root := "HKCU"
	if system {
		root = "HKLM"
	}
	return root + `\SOFTWARE\Mozilla\NativeMessagingHosts\` + hostName
}

func seedConfigNextTo(binary string) error {
	configFile := filepath.Join(filepath.Dir(binary), "config.json")
	if _, err := os.Stat(configFile); err == nil {
		return nil // keep an existing (possibly customized) config
	} else if !os.IsNotExist(err) {
		return err
	}
	return os.WriteFile(configFile, []byte("{\n  \"allowedRoots\": [\"~\"]\n}\n"), 0o644)
}
