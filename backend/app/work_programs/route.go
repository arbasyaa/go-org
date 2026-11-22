package work_programs

import (
	"backend/internal/auth"
	"backend/internal/contentform"
	"backend/internal/permission"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "work_program.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		list, err := services.WorkProgramService{}.ListAll(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "work programs", list)
	})(ctx)
}

func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "work_program.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		form, err := contentform.Read(c, "image")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.WorkProgramInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(true); err != nil {
			return c.Error(400, err.Error())
		}
		p, err := services.WorkProgramService{}.Create(c.Request.Context(), in)
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "create", "work_program", p.ID,
			"Membuat program kerja "+p.Name, c.Request.RemoteAddr)
		return c.Success(201, "work program created", p)
	})(ctx)
}
