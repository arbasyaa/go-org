// Package imageutil menormalkan bukti izin menjadi WebP (lossy) supaya hemat
// storage: cek tipe → cek dimensi → perkecil → encode WebP.
package imageutil

import (
	"bytes"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"net/http"

	"github.com/gen2brain/webp"
	"golang.org/x/image/draw"
)

const (
	// MaxUploadBytes batas ukuran file mentah yang diterima.
	MaxUploadBytes = 8 << 20
	// MaxPixels penjaga decompression bomb (40 MP).
	MaxPixels = 40 << 20
	// MaxDimension sisi terpanjang setelah diperkecil — foto HP 4000px bisa
	// turun ke ratusan KB tanpa terlihat beda di layar review.
	MaxDimension = 1600
	// Quality kualitas WebP lossy.
	Quality = 75
)

// Hanya gambar. Format lain (HEIC dari iPhone, PDF) ditolak dengan pesan
// arahan supaya user tidak bingung kenapa uploadnya gagal.
var allowedMIME = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// WebP mengubah gambar bukti menjadi WebP. Pesan error ditulis untuk user.
func WebP(data []byte) ([]byte, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("bukti gambar wajib diunggah")
	}
	if len(data) > MaxUploadBytes {
		return nil, fmt.Errorf("ukuran gambar maksimal %d MB", MaxUploadBytes>>20)
	}
	// Tipe di data URL bisa tidak sesuai isi file; percayai hasil sniff.
	mime := http.DetectContentType(data)
	if !allowedMIME[mime] {
		return nil, fmt.Errorf("bukti harus gambar JPG, PNG, atau WebP — format lain (mis. HEIC/PDF) belum didukung, ubah dulu ke JPG")
	}
	if width, height, err := configSize(data, mime); err == nil {
		if width*height > MaxPixels {
			return nil, fmt.Errorf("dimensi gambar terlalu besar (maksimal %d MP)", MaxPixels>>20)
		}
	}
	img, err := decode(data, mime)
	if err != nil {
		return nil, fmt.Errorf("gambar tidak bisa dibaca, coba foto ulang atau ubah ke JPG")
	}
	var out bytes.Buffer
	if err := webp.Encode(&out, shrink(img, MaxDimension), webp.Options{Quality: Quality}); err != nil {
		return nil, fmt.Errorf("gagal mengubah gambar ke WebP")
	}
	return out.Bytes(), nil
}

func configSize(data []byte, mime string) (int, int, error) {
	if mime == "image/webp" {
		cfg, err := webp.DecodeConfig(bytes.NewReader(data))
		if err != nil {
			return 0, 0, err
		}
		return cfg.Width, cfg.Height, nil
	}
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return 0, 0, err
	}
	return cfg.Width, cfg.Height, nil
}

func decode(data []byte, mime string) (image.Image, error) {
	reader := bytes.NewReader(data)
	switch mime {
	case "image/jpeg":
		return jpeg.Decode(reader)
	case "image/png":
		return png.Decode(reader)
	case "image/gif":
		return gif.Decode(reader)
	default:
		return webp.Decode(reader)
	}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// shrink memperkecil gambar secara proporsional kalau sisi terpanjangnya
// melebihi max.
func shrink(img image.Image, max int) image.Image {
	bounds := img.Bounds()
	longest := maxInt(bounds.Dx(), bounds.Dy())
	if longest <= max || longest == 0 {
		return img
	}
	scale := float64(max) / float64(longest)
	width := int(float64(bounds.Dx()) * scale)
	height := int(float64(bounds.Dy()) * scale)
	if width < 1 {
		width = 1
	}
	if height < 1 {
		height = 1
	}
	dst := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Src, nil)
	return dst
}
