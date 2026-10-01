package permission_categories

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET hanya butuh login: form "Ajukan Izin" milik anggota memakai daftar ini
// untuk memilih kategori, dan anggota tidak punya permission manajemen.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		list, err := services.PermissionCategoryService{}.List(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "permission categories", list)
	})(ctx)
}

func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "permission.categories.manage")
		if !ok {
			return c.Error(403, "forbidden")
		}
		var body struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := c.Bind(&body); err != nil {
			return c.Error(400, err.Error())
		}
		category, err := services.PermissionCategoryService{}.Create(c.Request.Context(), body.Name, body.Description)
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "create", "permission_category", category.ID,
			"Membuat kategori izin "+category.Name, c.Request.RemoteAddr)
		return c.Success(201, "category created", category)
	})(ctx)
}
