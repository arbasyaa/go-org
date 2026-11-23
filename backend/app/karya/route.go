package karya

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /karya — daftar semua kiriman untuk kurasi admin.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "karya.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		list, err := services.KaryaService{}.ListAll(c.Request.Context(), c.Query("status"))
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "karya list", list)
	})(ctx)
}
