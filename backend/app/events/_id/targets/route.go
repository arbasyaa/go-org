package event_targets

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /events/:id/targets — daftar peserta (roster) + jumlahnya, dipakai form
// event untuk preview cakupan dan halaman detail admin.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "events.view")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		roster, err := services.EventService{}.EventAudience(c.Request.Context(), id)
		if err != nil {
			return c.Error(500, err.Error())
		}
		participants := make([]map[string]any, 0, len(roster))
		for _, u := range roster {
			participants = append(participants, map[string]any{
				"id": u.ID, "username": u.Username, "full_name": u.FullName,
				"division_id": u.DivisionID, "role_id": u.RoleID,
			})
		}
		divisionIDs, roleIDs, err := services.EventService{}.EventTargets(c.Request.Context(), id)
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "event targets", map[string]any{
			"target_division_ids": divisionIDs,
			"target_role_ids":     roleIDs,
			"total":               len(participants),
			"participants":        participants,
		})
	})(ctx)
}
