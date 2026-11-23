package karya_preview

import (
	"backend/internal/clientip"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// POST /public/karya_preview — markdown kiriman dirender dengan fungsi yang sama
// persis dengan halaman detail, supaya pratinjau tidak pernah berbeda dari hasil
// akhir. Dibatasi limiter karena ini pekerjaan CPU dari masukan anonim.
//
// Rutenya sengaja sejajar (/public/karya_preview), bukan di bawah /public/karya:
// router gokil mencocokkan berurutan, jadi /public/karya/preview akan tertelan
// /public/karya/:code.
func POST(ctx *views.Context) error {
	if !services.AllowKaryaPreview(clientip.From(ctx)) {
		return ctx.Error(429, "terlalu banyak pratinjau, coba lagi nanti")
	}
	var body struct {
		AboutMD string `json:"about_md"`
	}
	if err := ctx.Bind(&body); err != nil {
		return ctx.Error(400, err.Error())
	}
	if len([]rune(body.AboutMD)) > services.KaryaMaxAboutChars {
		return ctx.Error(400, "tentang karya terlalu panjang")
	}
	return ctx.Success(200, "preview", map[string]any{
		"html": services.RenderKaryaMarkdown(body.AboutMD),
	})
}
