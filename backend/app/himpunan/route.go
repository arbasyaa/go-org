package himpunan

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
		if ok, _ := permission.UserHas(c, user, "himpunan.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		list, err := services.HimpunanService{}.ListAll(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "himpunan list", list)
	})(ctx)
}

func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "himpunan.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		form, err := contentform.Read(c, "image")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.HimpunanInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(true); err != nil {
			return c.Error(400, err.Error())
		}
		if form.Image != nil {
			url, err := form.Upload(c, "himpunan/logos")
			if err != nil {
				return c.Error(500, err.Error())
			}
			in.LogoURL = &url
		}
		p, err := services.HimpunanService{}.Create(c.Request.Context(), in)
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "create", "himpunan", p.ID,
			"Membuat himpunan "+p.Name, c.Request.RemoteAddr)
		return c.Success(201, "himpunan created", p)
	})(ctx)
}
