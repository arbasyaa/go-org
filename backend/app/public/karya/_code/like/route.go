package like

import (
	"errors"
	"strings"

	"backend/internal/clientip"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// POST /public/karya/:code/like — menaikkan angka like sekali per pengunjung.
//
// Identitas pengunjung hanya dipakai untuk deduplikasi: dibuat browser
// (localStorage) dan dikirim di body, lalu di-hash bersama IP. Respons tidak
// pernah memuat identitas apa pun, hanya angka terbaru.
func POST(ctx *views.Context) error {
	ip := clientip.From(ctx)
	if !services.AllowKaryaLike(ip) {
		return ctx.Error(429, "terlalu banyak like dari jaringan ini, coba lagi nanti")
	}
	var body struct {
		VisitorID string `json:"visitor_id"`
	}
	_ = ctx.Bind(&body)
	visitorID := strings.TrimSpace(body.VisitorID)
	if visitorID == "" || len(visitorID) > 64 {
		return ctx.Error(400, "id pengunjung tidak valid")
	}
	count, err := services.KaryaService{}.Like(ctx.Request.Context(), ctx.Param("code"),
		services.VisitorHash(visitorID, ip))
	if errors.Is(err, services.ErrKaryaNotFound) {
		return ctx.Error(404, "karya tidak ditemukan")
	}
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "like", map[string]any{"like_count": count})
}
