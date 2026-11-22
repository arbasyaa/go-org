package id

import (
	"backend/internal/auth"
	"backend/internal/permission"

	"github.com/lrndwy/gokil/views"
)

// canManage: pemegang invitations.manage (assign orang lain, hapus, konversi).
// Duplikat kecil dari helper di app/invitations/route.go — paket berbeda,
// dan mengekspornya lintas paket route hanya untuk satu fungsi tidak sepadan.
func canManage(c *views.Context) bool {
	user, _ := auth.CurrentUser(c.Request.Context())
	ok, err := permission.UserHas(c, user, "invitations.manage")
	return err == nil && ok
}
