package event_audience

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /event_audience — divisi + role + jumlah anggota untuk form cakupan event.
// Pemegang events.create/edit perlu ini meski tidak punya divisions.view.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHasAny(c, user, "events.create", "events.edit")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		data, err := services.UserService{}.AudienceCatalog(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "event audience catalog", data)
	})(ctx)
}
