package press_releases

import (
	"strconv"

	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/press_releases?limit=N — hanya yang published, terbaru dulu.
func GET(ctx *views.Context) error {
	limit, _ := strconv.Atoi(ctx.Request.URL.Query().Get("limit"))
	list, err := services.PressReleaseService{}.ListPublished(ctx.Request.Context(), limit)
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "press releases", list)
}
