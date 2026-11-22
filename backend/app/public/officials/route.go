package officials

import (
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /public/officials — pengurus dari tabel user (aktif, punya jabatan).
// Urut division_id lalu id.
func GET(ctx *views.Context) error {
	list, err := services.OfficialService{}.ListActive(ctx.Request.Context())
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	return ctx.Success(200, "officials", list)
}
