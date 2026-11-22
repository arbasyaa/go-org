package services

import "testing"

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Halo Dunia!":             "halo-dunia",
		"  --Rapat  Kerja 2026--": "rapat-kerja-2026",
		"Éxpo Äcara":              "xpo-cara",
		"!!!":                     "",
	}
	for in, want := range cases {
		if got := Slugify(in, 220); got != want {
			t.Errorf("Slugify(%q)=%q want %q", in, got, want)
		}
	}
	if got := Slugify("abc def ghi", 7); got != "abc-def" {
		t.Errorf("truncate: %q", got)
	}
}

func TestUniqueSlug(t *testing.T) {
	taken := map[string]bool{"a": true, "a-2": true}
	got, err := UniqueSlug("a", 220, func(s string) (bool, error) { return taken[s], nil })
	if err != nil || got != "a-3" {
		t.Fatalf("got %q err %v", got, err)
	}
	if got, _ := UniqueSlug("", 220, func(string) (bool, error) { return false, nil }); got != "berita" {
		t.Errorf("empty base: %q", got)
	}
}

func TestValidStockStatus(t *testing.T) {
	for _, s := range []string{"ready", "preorder", "soldout"} {
		if !ValidStockStatus(s) {
			t.Errorf("%s should be valid", s)
		}
	}
	for _, s := range []string{"", "Ready", "sold"} {
		if ValidStockStatus(s) {
			t.Errorf("%q should be invalid", s)
		}
	}
}

func TestSanitizeHTML(t *testing.T) {
	in := `<p onclick="x()">a</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><iframe src="x"></iframe>`
	if got, want := SanitizeHTML(in), `<p>a</p><a>l</a>`; got != want {
		t.Errorf("got %q want %q", got, want)
	}
}

func TestDetectImage(t *testing.T) {
	if _, err := DetectImage([]byte("\xff\xd8\xff\xe0")); err != nil {
		t.Error(err)
	}
	if _, err := DetectImage([]byte("%PDF-1.4")); err == nil {
		t.Error("pdf must be rejected")
	}
}
