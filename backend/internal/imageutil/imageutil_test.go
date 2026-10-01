package imageutil

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"strings"
	"testing"

	"github.com/gen2brain/webp"
)

func sample(t *testing.T, width, height int) *image.RGBA {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, color.RGBA{uint8(x % 256), uint8(y % 256), uint8((x * y) % 256), 255})
		}
	}
	return img
}

func TestWebPConvertsAndShrinks(t *testing.T) {
	var jpg bytes.Buffer
	if err := jpeg.Encode(&jpg, sample(t, 3200, 2400), &jpeg.Options{Quality: 95}); err != nil {
		t.Fatal(err)
	}
	out, err := WebP(jpg.Bytes())
	if err != nil {
		t.Fatalf("konversi gagal: %v", err)
	}
	if !bytes.HasPrefix(out, []byte("RIFF")) || !bytes.Contains(out[:16], []byte("WEBP")) {
		t.Fatalf("hasil bukan WebP: % x", out[:16])
	}
	if len(out) >= jpg.Len() {
		t.Fatalf("hasil tidak lebih ringan: webp=%d jpeg=%d", len(out), jpg.Len())
	}
	img, err := webp.Decode(bytes.NewReader(out))
	if err != nil {
		t.Fatal(err)
	}
	// Sisi terpanjang dipotong ke MaxDimension.
	if got := img.Bounds().Dx(); got != MaxDimension {
		t.Fatalf("lebar %d, ingin %d", got, MaxDimension)
	}
	if got := img.Bounds().Dy(); got != 1200 {
		t.Fatalf("tinggi %d, ingin 1200 (proporsional)", got)
	}
}

func TestWebPKeepsSmallImageSize(t *testing.T) {
	var pngBuf bytes.Buffer
	if err := png.Encode(&pngBuf, sample(t, 400, 300)); err != nil {
		t.Fatal(err)
	}
	out, err := WebP(pngBuf.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	img, err := webp.Decode(bytes.NewReader(out))
	if err != nil {
		t.Fatal(err)
	}
	if img.Bounds().Dx() != 400 || img.Bounds().Dy() != 300 {
		t.Fatalf("gambar kecil tidak boleh diperkecil: %v", img.Bounds())
	}
}

func TestWebPRejectsNonImageAndEmpty(t *testing.T) {
	cases := []struct {
		name string
		data []byte
		want string
	}{
		{"kosong", nil, "wajib diunggah"},
		{"pdf", []byte("%PDF-1.7\n%âãÏÓ\n1 0 obj"), "harus gambar"},
		{"teks", []byte("halo dunia, ini bukan gambar"), "harus gambar"},
	}
	for _, tc := range cases {
		_, err := WebP(tc.data)
		if err == nil {
			t.Fatalf("%s: harusnya ditolak", tc.name)
		}
		if !strings.Contains(err.Error(), tc.want) {
			t.Fatalf("%s: pesan %q tidak memuat %q", tc.name, err.Error(), tc.want)
		}
	}
}

func TestWebPRejectsTooLargeFile(t *testing.T) {
	big := make([]byte, MaxUploadBytes+1)
	copy(big, []byte("\xff\xd8\xff\xe0"))
	_, err := WebP(big)
	if err == nil || !strings.Contains(err.Error(), "maksimal") {
		t.Fatalf("file terlalu besar harus ditolak, dapat: %v", err)
	}
}
