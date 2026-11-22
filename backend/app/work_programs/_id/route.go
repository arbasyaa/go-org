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
	if ok, _ := permission.UserHas(c, user, "work_program.manage"); !ok {
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
		p, err := services.WorkProgramService{}.Get(c.Request.Context(), id)
		if err != nil {
			return fail(c, err)
		}
		return c.Success(200, "work_program", p)
	})(ctx)
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		svc := services.WorkProgramService{}
		if _, err := svc.Get(c.Request.Context(), id); err != nil {
			return fail(c, err)
		}
		form, err := contentform.Read(c, "image")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.WorkProgramInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(false); err != nil {
			return c.Error(400, err.Error())
		}
		p, err := svc.Update(c.Request.Context(), id, in)
		if err != nil {
			return fail(c, err)
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "work_program", id,
			"Memperbarui program kerja "+p.Name, c.Request.RemoteAddr)
		return c.Success(200, "work program updated", p)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, id, err := authorize(c)
		if user == nil {
			return err
		}
		if err := (services.WorkProgramService{}).Delete(c.Request.Context(), id); err != nil {
			return fail(c, err)
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "work_program", id,
			"Menghapus program kerja", c.Request.RemoteAddr)
		return c.Success(200, "work program deleted", nil)
	})(ctx)
}
