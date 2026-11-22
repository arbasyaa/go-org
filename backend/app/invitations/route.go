package invitations

import (
	"backend/internal/auth"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /invitations — kotak masuk undangan.
//
// Cukup login (tanpa permission khusus): anggota perlu melihat undangan untuk
// bisa menugaskan dirinya sendiri. Aksi yang menyentuh orang lain tetap
// digerbangi invitations.manage di handler masing-masing.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		list, err := services.InvitationService{}.List(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "invitations", list)
	})(ctx)
}
