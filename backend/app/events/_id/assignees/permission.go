package assignees

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/orm"
	"github.com/lrndwy/gokil/views"
)

// canManageEvent: pembuat event, anggota divisi penyelenggara, atau pemegang
// events.view_all. Disamakan dengan syarat edit event supaya siapa pun yang
// boleh mengubah event juga boleh mengatur pesertanya.
func canManageEvent(c *views.Context, user *auth.User, eventID int64) (bool, error) {
	e, err := orm.GetByID[models.Event](c.Request.Context(), eventID)
	if err != nil {
		return false, err
	}
	if ok, err := services.CanManageEvent(c.Request.Context(), e, user); err != nil || ok {
		return ok, err
	}
	return permission.UserHas(c, user, "events.view_all")
}
