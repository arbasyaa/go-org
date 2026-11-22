package work_programs

import (
	"strconv"

	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/work_programs — hanya is_active. Query opsional: limit, status
// (upcoming|done), category (program_kerja|agenda). Urutan: upcoming dulu
// (start_date ASC), lalu done (start_date DESC), lalu sort_order, id.
// Header X-Total-Count = jumlah total (setelah filter, sebelum limit).
func GET(ctx *views.Context) error {
	f := services.WorkProgramFilter{Status: ctx.Query("status"), Category: ctx.Query("category")}
	if f.Status != "" && f.Status != services.WorkProgramStatusUpcoming && f.Status != services.WorkProgramStatusDone {
		return ctx.Error(400, "status tidak valid")
	}
	if f.Category != "" && f.Category != services.WorkProgramCategoryProgram && f.Category != services.WorkProgramCategoryAgenda {
		return ctx.Error(400, "category tidak valid")
	}
	if s := ctx.Query("limit"); s != "" {
		n, err := strconv.Atoi(s)
		if err != nil || n < 0 {
			return ctx.Error(400, "limit tidak valid")
		}
		f.Limit = n
	}
	list, total, err := services.WorkProgramService{}.ListPublic(ctx.Request.Context(), f)
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	ctx.Writer.Header().Set("X-Total-Count", strconv.Itoa(total))
	return ctx.Success(200, "work programs", list)
}
