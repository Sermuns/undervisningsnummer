package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

func parseHTML(file *os.File, urlPath string) ([]byte, error) {
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`<cgi script="([^"]+)">`)

	replaced := re.ReplaceAllFunc(content, func(match []byte) []byte {
		matches := re.FindSubmatch(match)
		if len(matches) != 2 {
			return match // couldn't find script? bail..
		}

		scriptPath := filepath.Join(
			filepath.Dir(file.Name()),
			string(matches[1]),
		)

		scriptOutput, err := exec.Command(scriptPath, urlPath).Output()
		if err != nil {
			log.Printf("Error executing script %s: %v", scriptOutput, err)
			return match
		}

		headerEndIndex := bytes.Index(scriptOutput, []byte("\n\n"))
		if headerEndIndex == -1 {
			log.Printf("Unable to find script output header ending")
			return match
		}

		return scriptOutput[headerEndIndex+2:]
	})

	return replaced, nil
}

func defaultHandler(w http.ResponseWriter, r *http.Request) {
	path := filepath.Join("../public/", r.URL.Path)

	fileInfo, err := os.Stat(path)
	if err != nil {
		// might be naive...
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	if fileInfo.IsDir() {
		path = filepath.Join(path, "index.html")
	}
	file, err := os.Open(path)
	defer file.Close()

	// just a static file, no parsing needed
	if !strings.HasSuffix(path, ".html") {
		http.ServeFile(w, r, path)
		return
	}

	content, err := parseHTML(file, r.URL.Path+"?"+r.URL.RawQuery)
	if err != nil {
		http.Error(w, "Error processing HTML file", http.StatusInternalServerError)
		return
	}

	http.ServeContent(
		w,
		r,
		filepath.Base(path),
		fileInfo.ModTime(),
		bytes.NewReader(content),
	)
}

const (
	ADDRESS = ":3000"
)

func main() {
	http.HandleFunc("/", defaultHandler)
	fmt.Println("Starting local server on", ADDRESS)
	log.Fatal(
		http.ListenAndServe(ADDRESS, nil),
	)
}
