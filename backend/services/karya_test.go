package services

import (
	"strings"
	"testing"
)

func TestNormalizeRepoURL(t *testing.T) {
	ok := map[string]string{
		"https://github.com/arbasyaa/go-org":         "https://github.com/arbasyaa/go-org",
		"  https://github.com/arbasyaa/go-org/  ":    "https://github.com/arbasyaa/go-org",
		"https://github.com/arbasyaa/go-org.git":     "https://github.com/arbasyaa/go-org",
		"https://GITHUB.com/arbasyaa/go-org":         "https://github.com/arbasyaa/go-org",
		"https://github.com/arbasyaa/go-org/tree/ma": "",
	}
	for in, want := range ok {
		got, err := NormalizeRepoURL(in)
		if want == "" {
			if err == nil {
				t.Errorf("%q seharusnya ditolak, dapat %q", in, got)
			}
			continue
		}
		if err != nil {
			t.Errorf("%q ditolak: %v", in, err)
			continue
		}
		if got != want {
			t.Errorf("%q -> %q, mau %q", in, got, want)
		}
	}

	bad := []string{
		"", "github.com/a/b", "http://github.com/a/b", "https://gitlab.com/a/b",
		"https://github.com/a", "https://github.com/a/b?x=1", "https://github.com/a/b#x",
		"https://user@github.com/a/b", "https://github.com:8443/a/b",
		"https://evil.com/github.com/a/b",
	}
	for _, in := range bad {
		if got, err := NormalizeRepoURL(in); err == nil {
			t.Errorf("%q seharusnya ditolak, dapat %q", in, got)
		}
	}
}

func TestRenderKaryaMarkdownAman(t *testing.T) {
	cases := []struct {
		in             string
		mustNotContain []string
	}{
		{"<script>alert(1)</script>", []string{"<script"}},
		{`<img src=x onerror="alert(1)">`, []string{"onerror", "<img src=x"}},
		{"[klik](javascript:alert(1))", []string{"javascript:"}},
		{`<a href="javascript:alert(1)">x</a>`, []string{"javascript:"}},
		{"![x](data:text/html;base64,PHNjcmlwdD4=)", []string{"data:text/html"}},
		{"<iframe src=\"https://evil\"></iframe>", []string{"<iframe"}},
	}
	for _, c := range cases {
		out := RenderKaryaMarkdown(c.in)
		for _, bad := range c.mustNotContain {
			if strings.Contains(strings.ToLower(out), strings.ToLower(bad)) {
				t.Errorf("masukan %q masih memuat %q: %s", c.in, bad, out)
			}
		}
	}
}

func TestRenderKaryaMarkdownTetapBerguna(t *testing.T) {
	out := RenderKaryaMarkdown("## Judul\n\n**tebal** dan [repo](https://example.com)\n")
	for _, want := range []string{"<h2", "<strong>", `href="https://example.com"`, "noopener"} {
		if !strings.Contains(out, want) {
			t.Errorf("hasil render kehilangan %q: %s", want, out)
		}
	}
}

func TestNewKaryaCode(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 200; i++ {
		code, err := newKaryaCode()
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if len(code) != len("KRY-")+6 || !strings.HasPrefix(code, "KRY-") {
			t.Fatalf("format kode salah: %q", code)
		}
		for _, r := range code[4:] {
			if !strings.ContainsRune(karyaAlphabet, r) {
				t.Fatalf("kode memuat karakter ambigu: %q", code)
			}
		}
		if seen[code] {
			t.Fatalf("kode berulang: %q", code)
		}
		seen[code] = true
	}
}

func TestValidateKaryaInput(t *testing.T) {
	base := KaryaSubmitInput{
		Title: "Repo Uji", AuthorName: "Pengirim Uji", HimpunanID: 1,
		RepoURL:   "https://github.com/a/b",
		AboutMD:   strings.Repeat("a", KaryaMinAboutChars),
		ImageURLs: []string{"karya/image.webp"},
	}
	if _, err := base.validate(); err != nil {
		t.Fatalf("input sah ditolak: %v", err)
	}

	mutations := map[string]func(*KaryaSubmitInput){
		"judul kosong":         func(i *KaryaSubmitInput) { i.Title = "" },
		"judul terlalu pendek": func(i *KaryaSubmitInput) { i.Title = "ab" },
		"pengirim kosong":      func(i *KaryaSubmitInput) { i.AuthorName = "" },
		"tanpa himpunan":       func(i *KaryaSubmitInput) { i.HimpunanID = 0 },
		"about pendek":         func(i *KaryaSubmitInput) { i.AboutMD = "pendek" },
		"about kepanjangan":    func(i *KaryaSubmitInput) { i.AboutMD = strings.Repeat("a", KaryaMaxAboutChars+1) },
		"tanpa gambar":         func(i *KaryaSubmitInput) { i.ImageURLs = nil },
		"foto kebanyakan":      func(i *KaryaSubmitInput) { i.ImageURLs = []string{"1", "2", "3", "4", "5", "6"} },
		"repo bukan github":    func(i *KaryaSubmitInput) { i.RepoURL = "https://gitlab.com/a/b" },
	}
	for name, mutate := range mutations {
		in := base
		mutate(&in)
		if _, err := in.validate(); err == nil {
			t.Errorf("%s seharusnya ditolak", name)
		}
	}
}

func TestVisitorHash(t *testing.T) {
	a := VisitorHash("pengunjung-1", "10.0.0.1")
	if a != VisitorHash("pengunjung-1", "10.0.0.1") {
		t.Fatal("hash harus stabil")
	}
	if a == VisitorHash("pengunjung-2", "10.0.0.1") {
		t.Error("pengunjung berbeda harus menghasilkan hash berbeda")
	}
	if a == VisitorHash("pengunjung-1", "10.0.0.2") {
		t.Error("IP berbeda harus menghasilkan hash berbeda")
	}
	if len(a) != 64 {
		t.Errorf("panjang hash %d, mau 64", len(a))
	}
}
