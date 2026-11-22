package id

import (
	"errors"

	"backend/internal/auth"
	"backend/internal/contentform"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

func authorize(c *views.Context) (*auth.User, int64, error) {
	user, _ := auth.CurrentUser(c.Request.Context())
	if ok, _ := permission.UserHas(c, user, "press_release.manage"); !ok {
		return nil, 0, c.Error(403, "akses ditolak")
	}
	id, err := models.ParseID(c.Param("id"))
	if err != nil {
		return nil, 0, c.Error(400, "id tidak valid")
	}
	return user, id, nil
}

func fail(c *views.Context, err error) error {
	if errors.Is(err, services.ErrContentNotFound) {
		return c.Error(404, err.Error())
	}
	return c.Error(500, err.Error())
}

func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		p, err := services.PressReleaseService{}.Get(c.Request.Context(), id)
		if err != nil {
			return fail(c, err)
		}
		return c.Success(200, "press release", p)
	})(ctx)
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		svc := services.PressReleaseService{}
		if _, err := svc.Get(c.Request.Context(), id); err != nil {
			return fail(c, err)
		}
		form, err := contentform.Read(c, "cover")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.PressReleaseInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(false); err != nil {
			return c.Error(400, err.Error())
		}
		if form.Image != nil {
			url, err := form.Upload(c, "press_releases/covers")
			if err != nil {
				return c.Error(500, err.Error())
			}
			in.CoverURL = &url
		}
		p, err := svc.Update(c.Request.Context(), id, in)
		if err != nil {
			return fail(c, err)
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "press_release", id,
			"Memperbarui press release "+p.Title, c.Request.RemoteAddr)
		return c.Success(200, "press release updated", p)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		if err := (services.PressReleaseService{}).Delete(c.Request.Context(), id); err != nil {
			return fail(c, err)
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "press_release", id,
			"Menghapus press release", c.Request.RemoteAddr)
		return c.Success(200, "press release deleted", nil)
	})(ctx)
}
