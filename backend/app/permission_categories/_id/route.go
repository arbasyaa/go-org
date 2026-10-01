package id

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// writeError: 404 kalau barisnya tidak ada, 400 tanpa pesan SQL mentah kalau
// ditolak aturan (nama kosong / kategori masih dipakai).
func writeError(c *views.Context, err error, label string) error {
	if err == services.ErrNotFound {
		return c.Error(404, label+" tidak ditemukan")
	}
	return c.Error(400, err.Error())
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "permission.categories.manage")
		if !ok {
			return c.Error(403, "forbidden")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "invalid id")
		}
		var body map[string]any
		if err := c.Bind(&body); err != nil {
			return c.Error(400, err.Error())
		}
		category, err := services.PermissionCategoryService{}.Update(c.Request.Context(), id, body)
		if err != nil {
			return writeError(c, err, "kategori")
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "permission_category", id,
			"Memperbarui kategori izin", c.Request.RemoteAddr)
		return c.Success(200, "category updated", category)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "permission.categories.manage")
		if !ok {
			return c.Error(403, "forbidden")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "invalid id")
		}
		if err := (services.PermissionCategoryService{}).Delete(c.Request.Context(), id); err != nil {
			return writeError(c, err, "kategori")
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "permission_category", id,
			"Menghapus kategori izin", c.Request.RemoteAddr)
		return c.Success(200, "category deleted", nil)
	})(ctx)
}
