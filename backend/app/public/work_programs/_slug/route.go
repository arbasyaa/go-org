package slug

import (
	"errors"

	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/work_programs/:slug — 404 bila tidak ada / tidak aktif.
func GET(ctx *views.Context) error {
	p, err := services.WorkProgramService{}.GetActiveBySlug(ctx.Request.Context(), ctx.Param("slug"))
	if errors.Is(err, services.ErrContentNotFound) {
		return ctx.Error(404, "program tidak ditemukan")
	}
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "work program", p)
}
