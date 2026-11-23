package code

import (
	"errors"

	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/karya/:code — detail karya yang sudah tayang, sudah dirender dari
// markdown. Karya yang masih review/ditolak tidak bisa dibuka lewat sini.
func GET(ctx *views.Context) error {
	item, err := services.KaryaService{}.PublicByCode(ctx.Request.Context(), ctx.Param("code"))
	if errors.Is(err, services.ErrKaryaNotFound) {
		return ctx.Error(404, "karya tidak ditemukan")
	}
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "karya", item)
}
