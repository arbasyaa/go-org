package members

import (
	"backend/internal/auth"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// Direktori anggota untuk panel anggota: cukup login, tanpa permission
// (mengikuti pola GET /divisions — data profil dasar non-sensitif).
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		status := c.Query("status")
		if status == "" {
			status = "active"
		}
		list, err := services.UserService{}.ListPublic(c.Request.Context(), status)
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "members", list)
	})(ctx)
}
