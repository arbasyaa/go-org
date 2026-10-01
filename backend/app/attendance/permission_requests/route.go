package permission_requests

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// URL: /attendance/permission_requests (underscore; PRD hyphen variant documented here)

func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		canApproveAll, _ := permission.UserHas(c, user, "attendance.approve")
		canApproveOwn, _ := permission.UserHas(c, user, "attendance.approve_own")
		if !canApproveAll && !canApproveOwn {
			return c.Error(403, "forbidden")
		}
		// approve_own (Kadiv/Sekdiv pemilik event) hanya menerima pengajuan dari
		// event yang mereka kelola, bukan seluruh organisasi.
		list, err := services.PermissionRequestService{}.ListReviewable(c.Request.Context(), user, canApproveAll)
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "permission requests", list)
	})(ctx)
}
