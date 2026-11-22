package merch

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
		if ok, _ := permission.UserHas(c, user, "merch.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		list, err := services.MerchService{}.ListAll(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "merch items", list)
	})(ctx)
}

func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "merch.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		form, err := contentform.Read(c, "image")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.MerchInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(true); err != nil {
			return c.Error(400, err.Error())
		}
		if form.Image != nil {
			url, err := form.Upload(c, "merch/images")
			if err != nil {
				return c.Error(500, err.Error())
			}
			in.ImageURL = &url
		}
		p, err := services.MerchService{}.Create(c.Request.Context(), in)
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "create", "merch", p.ID,
			"Membuat merch "+p.Name, c.Request.RemoteAddr)
		return c.Success(201, "merch item created", p)
	})(ctx)
}
