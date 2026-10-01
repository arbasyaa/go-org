package app

import (
	"os"
	"regexp"
	"strings"
	"testing"
)

type route struct {
	method string
	path   string
}

var routeRE = regexp.MustCompile(`RegisterRoute\("(\w+)", "([^"]+)"`)

// shadowed mengembalikan route statis yang didahului route dinamis berbentuk
// sama. Router gokil linear: yang cocok lebih dulu menang, jadi /letters/export
// yang terdaftar setelah /letters/:id akan dibaca sebagai id dan menjawab 400.
func shadowed(routes []route) []string {
	var out []string
	for i, r := range routes {
		if strings.Contains(r.path, ":") {
			continue
		}
		for _, earlier := range routes[:i] {
			if earlier.method != r.method || !strings.Contains(earlier.path, ":") {
				continue
			}
			a, b := strings.Split(earlier.path, "/"), strings.Split(r.path, "/")
			if len(a) != len(b) {
				continue
			}
			match := true
			for j := range a {
				if a[j] != b[j] && !strings.HasPrefix(a[j], ":") {
					match = false
					break
				}
			}
			if match {
				out = append(out, r.method+" "+r.path+" kalah oleh "+earlier.method+" "+earlier.path)
				break
			}
		}
	}
	return out
}

func TestShadowedDetectorCatchesRealCase(t *testing.T) {
	routes := []route{
		{"GET", "/letters"},
		{"GET", "/letters/:id"},
		{"GET", "/letters/export"},
		{"GET", "/users/:id"},
		{"GET", "/users/import/template"}, // beda jumlah segmen → aman
	}
	got := shadowed(routes)
	want := []string{"GET /letters/export kalah oleh GET /letters/:id"}
	if len(got) != 1 || got[0] != want[0] {
		t.Fatalf("detector salah: got %v want %v", got, want)
	}
}

// TestRegisterHasNoShadowedRoute menjaga kelas bug yang sama tidak kembali:
// route statis dua segmen di bawah resource yang punya /:id harus didaftarkan
// lebih dulu (atau digabung ke handler list, seperti /letters?export=csv).
func TestRegisterHasNoShadowedRoute(t *testing.T) {
	data, err := os.ReadFile("register.go")
	if err != nil {
		t.Fatalf("baca register.go: %v", err)
	}
	var routes []route
	for _, m := range routeRE.FindAllStringSubmatch(string(data), -1) {
		routes = append(routes, route{m[1], m[2]})
	}
	if len(routes) < 50 {
		t.Fatalf("hanya %d route terbaca, parsing register.go gagal?", len(routes))
	}
	if bad := shadowed(routes); len(bad) > 0 {
		t.Fatalf("route statis tertutup route dinamis (router gokil linear):\n  %s", strings.Join(bad, "\n  "))
	}
}
