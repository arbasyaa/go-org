package convert

import (
	"errors"
	"strconv"

	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// POST /invitations/:id/convert — jadikan undangan sebagai Event.
//
// Butuh DUA permission: invitations.manage (mengelola undangan) dan
// events.create (membuat event). Alasannya: jalur ini membuat baris di tabel
// event yang sama dengan form event biasa, jadi role yang tidak boleh membuat
// event tidak boleh mendapatkannya lewat pintu samping.
func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		okManage, _ := permission.UserHas(c, user, "invitations.manage")
		okCreate, _ := permission.UserHas(c, user, "events.create")
		if !okManage || !okCreate {
			return c.Error(403, "akses ditolak")
		}

		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}

		inv, event, err := services.InvitationService{}.Convert(c.Request.Context(), id, user.ID)
		if err != nil {
			switch {
			case errors.Is(err, services.ErrNotFound):
				return c.Error(404, "undangan tidak ditemukan")
			case errors.Is(err, services.ErrInvitationConverted):
				return c.Error(409, "undangan ini sudah dikonversi menjadi event")
			default:
				return c.Error(400, err.Error())
			}
		}

		services.LogActivity(c.Request.Context(), user.ID, "convert", "invitation", id,
			"Mengonversi undangan menjadi event #"+strconv.FormatInt(event.ID, 10), c.Request.RemoteAddr)
		return c.Success(201, "undangan dikonversi menjadi event", map[string]any{
			"invitation": inv,
			"event":      event,
		})
	})(ctx)
}
