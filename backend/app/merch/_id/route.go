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
	if ok, _ := permission.UserHas(c, user, "merch.manage"); !ok {
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
		p, err := services.MerchService{}.Get(c.Request.Context(), id)
		if err != nil {
			return fail(c, err)
		}
		return c.Success(200, "merch", p)
	})(ctx)
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		svc := services.MerchService{}
		if _, err := svc.Get(c.Request.Context(), id); err != nil {
			return fail(c, err)
		}
		form, err := contentform.Read(c, "image")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.MerchInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(false); err != nil {
			return c.Error(400, err.Error())
		}
		if form.Image != nil {
			url, err := form.Upload(c, "merch/images")
			if err != nil {
				return c.Error(500, err.Error())
			}
			in.ImageURL = &url
		}
		p, err := svc.Update(c.Request.Context(), id, in)
		if err != nil {
			return fail(c, err)
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "merch", id,
			"Memperbarui merch "+p.Name, c.Request.RemoteAddr)
		return c.Success(200, "merch updated", p)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		if err := (services.MerchService{}).Delete(c.Request.Context(), id); err != nil {
			return fail(c, err)
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "merch", id,
			"Menghapus merch", c.Request.RemoteAddr)
		return c.Success(200, "merch deleted", nil)
	})(ctx)
}
