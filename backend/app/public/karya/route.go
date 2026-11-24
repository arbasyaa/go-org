package karya

import (
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"backend/internal/clientip"
	"backend/internal/imageutil"
	"backend/internal/storageutil"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// Batas ukuran form: gambar (ditangani imageutil) + teks markdown + selisih
// multipart. Route menolak lebih awal supaya tidak membaca body besar.
const karyaFormMaxBytes = imageutil.MaxUploadBytes + (1 << 20)

// GET /public/karya — hanya karya yang sudah tayang.
//
// Karya unggulan untuk landing memakai endpoint ini juga: `?limit=1` dengan
// urutan default sudah berarti "like terbanyak, lalu kiriman terlama".
func GET(ctx *views.Context) error {
	himpunanID, _ := strconv.ParseInt(ctx.Query("himpunan_id"), 10, 64)
	limit := clampQuery(ctx.Query("limit"), 12, 1, 48)
	offset := clampQuery(ctx.Query("offset"), 0, 0, 100000)
	items, total, err := services.KaryaService{}.ListPublic(
		ctx.Request.Context(), himpunanID, ctx.Query("sort"), limit, offset)
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	ctx.Writer.Header().Set("X-Total-Count", strconv.Itoa(total))
	return ctx.Success(200, "karya", items)
}

// POST /public/karya — pengajuan tanpa login. Balikan hanya kode pelacakan.
//
// Urutan penting: validasi (murah) → unggah gambar (mahal) → simpan. Kalau
// unggah gagal, belum ada baris DB yang tertinggal.
func POST(ctx *views.Context) error {
	ip := clientip.From(ctx)

	if err := ctx.ParseMultipart(karyaFormMaxBytes); err != nil {
		return ctx.Error(400, "gagal membaca form: "+err.Error())
	}

	// Honeypot: field ini tersembunyi di UI dan hanya terisi bot. Balas sukses
	// palsu supaya bot tidak belajar apa pun, tanpa menyimpan apa pun.
	if strings.TrimSpace(ctx.Request.FormValue("website")) != "" {
		return ctx.Success(201, "karya terkirim", map[string]any{"code": ""})
	}
	if !services.AllowKaryaSubmit(ip) {
		return ctx.Error(429, "terlalu banyak pengajuan dari jaringan ini, coba lagi nanti")
	}

	// Sampai 5 foto. Batas diperiksa sebelum membaca isi berkas supaya
	// pengiriman berlebihan ditolak murah.
	images := []string{}
	if mf := ctx.Request.MultipartForm; mf != nil {
		if files := mf.File["image"]; len(files) > services.KaryaMaxImages {
			return ctx.Error(400, fmt.Sprintf("foto maksimal %d", services.KaryaMaxImages))
		}
	}
	if files := ctx.Request.MultipartForm.File["image"]; len(files) > 0 {
		for i, header := range files {
			file, err := header.Open()
			if err != nil {
				return ctx.Error(400, "gagal membaca gambar")
			}
			data, err := io.ReadAll(io.LimitReader(file, imageutil.MaxUploadBytes+1))
			file.Close()
			if err != nil {
				return ctx.Error(400, "gagal membaca gambar")
			}
			// Re-encode: validasi isi file, kecilkan ke 1600 px, simpan WebP.
			webp, err := imageutil.WebP(data)
			if err != nil {
				return ctx.Error(400, err.Error())
			}
			// storageutil.Key memakai detik + nama berkas, jadi lima foto yang
			// diunggah dalam detik yang sama akan bertabrakan kalau namanya sama.
			// Nomor urut membuat setiap key unik.
			name := fmt.Sprintf("image-%d-%d.webp", i, time.Now().UnixNano())
			url, err := storageutil.Upload(ctx.Request.Context(),
				storageutil.Key("karya", name), webp, "image/webp")
			if err != nil {
				return ctx.Error(500, "gagal menyimpan gambar")
			}
			images = append(images, url)
		}
	}

	himpunanID, _ := strconv.ParseInt(ctx.Request.FormValue("himpunan_id"), 10, 64)
	item, err := services.KaryaService{}.Submit(ctx.Request.Context(), services.KaryaSubmitInput{
		Title:      ctx.Request.FormValue("title"),
		AuthorName: ctx.Request.FormValue("author_name"),
		HimpunanID: himpunanID,
		RepoURL:    ctx.Request.FormValue("repo_url"),
		AboutMD:    ctx.Request.FormValue("about_md"),
		ImageURLs:  images,
	})
	if err != nil {
		return ctx.Error(400, err.Error())
	}
	// Hanya kode: jangan bocorkan id internal, path storage, atau IP pengirim.
	return ctx.Success(201, "karya terkirim", map[string]any{"code": item.Code})
}

func clampQuery(raw string, def, min, max int) int {
	n, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil {
		return def
	}
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}
