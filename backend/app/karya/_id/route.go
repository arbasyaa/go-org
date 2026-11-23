package id

import (
	"errors"

	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /karya/:id — detail satu kiriman untuk halaman kurasi admin, termasuk
// isi markdown yang sudah dirender.
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "karya.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		item, err := services.KaryaService{}.ByID(c.Request.Context(), id)
		if errors.Is(err, services.ErrKaryaNotFound) {
			return c.Error(404, "karya tidak ditemukan")
		}
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "karya", item)
	})(ctx)
}

// PUT /karya/:id — keputusan kurasi: publish atau tolak, dengan catatan opsional.
func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "karya.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		var body struct {
			Status     string `json:"status"`
			ReviewNote string `json:"review_note"`
		}
		if err := c.Bind(&body); err != nil {
			return c.Error(400, err.Error())
		}
		item, err := services.KaryaService{}.Review(c.Request.Context(), id, body.Status, body.ReviewNote)
		if errors.Is(err, services.ErrKaryaNotFound) {
			return c.Error(404, "karya tidak ditemukan")
		}
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "karya", id,
			"Meninjau karya #"+c.Param("id")+" -> "+item.Status, c.Request.RemoteAddr)
		return c.Success(200, "karya updated", item)
	})(ctx)
}

// DELETE /karya/:id — menghapus kiriman beserta like-nya (CASCADE).
func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "karya.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		err = services.KaryaService{}.Delete(c.Request.Context(), id)
		if errors.Is(err, services.ErrKaryaNotFound) {
			return c.Error(404, "karya tidak ditemukan")
		}
		if err != nil {
			return c.Error(500, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "karya", id,
			"Menghapus karya", c.Request.RemoteAddr)
		return c.Success(200, "karya deleted", nil)
	})(ctx)
}
