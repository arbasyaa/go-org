package services

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

// ImageMaxBytes: batas gambar cover/produk yang diunggah admin.
const ImageMaxBytes = 5 << 20 // 5 MB

// ImageInfo hasil deteksi magic bytes.
type ImageInfo struct {
	MIME string
	Ext  string
}

// DetectImage memeriksa magic bytes (bukan ekstensi/MIME klien) dan ukuran.
// Hanya jpeg, png, webp.
func DetectImage(data []byte) (ImageInfo, error) {
	if len(data) > ImageMaxBytes {
		return ImageInfo{}, fmt.Errorf("gambar maksimal 5 MB")
	}
	switch {
	case len(data) >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF:
		return ImageInfo{"image/jpeg", ".jpg"}, nil
	case len(data) >= 8 && string(data[:8]) == "\x89PNG\r\n\x1a\n":
		return ImageInfo{"image/png", ".png"}, nil
	case len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP":
		return ImageInfo{"image/webp", ".webp"}, nil
	}
	return ImageInfo{}, fmt.Errorf("gambar harus berformat JPEG, PNG, atau WebP")
}

// Slugify: huruf kecil, non-alfanumerik -> '-', dipangkas ke maxLen.
func Slugify(s string, maxLen int) string {
	var b strings.Builder
	dash := true // hindari '-' di awal
	for _, r := range strings.ToLower(s) {
		if r < unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r)) {
			b.WriteRune(r)
			dash = false
		} else if !dash {
			b.WriteByte('-')
			dash = true
		}
	}
	out := strings.Trim(b.String(), "-")
	if len(out) > maxLen {
		out = strings.Trim(out[:maxLen], "-")
	}
	return out
}

// UniqueSlug menambah -2, -3, ... sampai exists(candidate) false. Pure: DB
// dicek lewat callback supaya bisa diuji tanpa database.
func UniqueSlug(base string, maxLen int, exists func(string) (bool, error)) (string, error) {
	if base == "" {
		base = "berita"
	}
	cand := base
	for n := 2; n < 10000; n++ {
		taken, err := exists(cand)
		if err != nil {
			return "", err
		}
		if !taken {
			return cand, nil
		}
		suffix := "-" + strconv.Itoa(n)
		b := base
		if len(b)+len(suffix) > maxLen {
			b = strings.Trim(b[:maxLen-len(suffix)], "-")
		}
		cand = b + suffix
	}
	return "", fmt.Errorf("gagal membuat slug unik")
}

// Sanitizer HTML konservatif (belum ada library sanitizer di proyek): membuang
// elemen berbahaya beserta isinya, tag berbahaya lain, atribut on*, dan URL
// javascript:/data: pada href/src. Bukan pengganti bluemonday -- lihat
// PONYTAIL-DEBT bila konten mulai datang dari sumber yang tidak dipercaya.
var (
	reDangerBlock = regexp.MustCompile(`(?is)<\s*(script|style|iframe|object|embed|noscript)\b[^>]*>.*?<\s*/\s*(script|style|iframe|object|embed|noscript)\s*>`)
	reDangerTag   = regexp.MustCompile(`(?is)<\s*/?\s*(script|style|iframe|object|embed|noscript|link|meta|base|form)\b[^>]*>`)
	reOnAttr      = regexp.MustCompile(`(?is)\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)`)
	reJSURL       = regexp.MustCompile(`(?is)\s+(href|src|xlink:href|formaction|action)\s*=\s*("\s*(javascript|vbscript|data):[^"]*"|'\s*(javascript|vbscript|data):[^']*'|(javascript|vbscript|data):[^\s>]*)`)
)

func SanitizeHTML(s string) string {
	for prev := ""; prev != s; {
		prev = s
		s = reDangerBlock.ReplaceAllString(s, "")
		s = reDangerTag.ReplaceAllString(s, "")
		s = reOnAttr.ReplaceAllString(s, "")
		s = reJSURL.ReplaceAllString(s, "")
	}
	return s
}

// strPtr mengembalikan pointer nilai form bila key dikirim.
func formStr(v map[string]string, key string) *string {
	if s, ok := v[key]; ok {
		s = strings.TrimSpace(s)
		return &s
	}
	return nil
}

func formBool(v map[string]string, key string) (*bool, error) {
	s, ok := v[key]
	if !ok {
		return nil, nil
	}
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "true", "1", "on":
		t := true
		return &t, nil
	case "false", "0", "off", "":
		f := false
		return &f, nil
	}
	return nil, fmt.Errorf("%s harus true atau false", key)
}
