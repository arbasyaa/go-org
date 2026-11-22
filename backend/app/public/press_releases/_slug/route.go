package slug

import (
	"errors"

	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/press_releases/:slug — 404 untuk draft / tidak ada.
func GET(ctx *views.Context) error {
	p, err := services.PressReleaseService{}.GetPublishedBySlug(ctx.Request.Context(), ctx.Param("slug"))
	if errors.Is(err, services.ErrContentNotFound) {
		return ctx.Error(404, "press release tidak ditemukan")
	}
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "press release", p)
}
