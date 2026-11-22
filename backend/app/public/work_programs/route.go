package work_programs

import (
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/work_programs — hanya is_active, urut sort_order lalu id.
func GET(ctx *views.Context) error {
	list, err := services.WorkProgramService{}.ListActive(ctx.Request.Context())
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "work programs", list)
}
