// Command download-router-host is the native messaging helper for the
// Download Router Firefox extension. It receives move requests on stdin and
// relocates finished downloads to user-configured folders, something the
// WebExtension APIs cannot do on their own.
package main

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"os"
)

const version = "0.1.0"

// The browser may send messages up to 1 MiB; ours are tiny, so this is a
// generous upper bound that also guards against malformed length prefixes.
const maxMessageSize = 1 << 20

type request struct {
	Type        string `json:"type"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
}

type response struct {
	OK           bool     `json:"ok"`
	FinalPath    string   `json:"finalPath,omitempty"`
	Error        string   `json:"error,omitempty"`
	Version      string   `json:"version,omitempty"`
	AllowedRoots []string `json:"allowedRoots,omitempty"`
}

// Native messaging frames messages with a 4-byte length prefix in native byte
// order followed by the UTF-8 JSON payload. All target platforms are
// little-endian.
func readMessage(r io.Reader) (request, error) {
	var length uint32
	if err := binary.Read(r, binary.LittleEndian, &length); err != nil {
		return request{}, err
	}
	if length == 0 || length > maxMessageSize {
		return request{}, errors.New("invalid message length")
	}
	buf := make([]byte, length)
	if _, err := io.ReadFull(r, buf); err != nil {
		return request{}, err
	}
	var msg request
	if err := json.Unmarshal(buf, &msg); err != nil {
		return request{}, err
	}
	return msg, nil
}

func writeMessage(w io.Writer, resp response) error {
	payload, err := json.Marshal(resp)
	if err != nil {
		return err
	}
	if err := binary.Write(w, binary.LittleEndian, uint32(len(payload))); err != nil {
		return err
	}
	_, err = w.Write(payload)
	return err
}

func handle(msg request, cfg Config) response {
	switch msg.Type {
	case "ping":
		return response{OK: true, Version: version, AllowedRoots: cfg.AllowedRoots}
	case "move":
		final, err := moveFile(msg.Source, msg.Destination, cfg.AllowedRoots)
		if err != nil {
			return response{OK: false, Error: err.Error()}
		}
		return response{OK: true, FinalPath: final}
	default:
		return response{OK: false, Error: "unknown message type: " + msg.Type}
	}
}

func main() {
	cfg, err := loadConfig()
	if err != nil {
		// Without a valid allowlist we cannot validate destinations safely.
		_ = writeMessage(os.Stdout, response{OK: false, Error: "configuration error: " + err.Error()})
		os.Exit(1)
	}

	for {
		msg, err := readMessage(os.Stdin)
		if errors.Is(err, io.EOF) {
			return
		}
		if err != nil {
			return
		}
		if err := writeMessage(os.Stdout, handle(msg, cfg)); err != nil {
			return
		}
	}
}
