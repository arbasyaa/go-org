package press_releases

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
		if ok, _ := permission.UserHas(c, user, "press_release.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		list, err := services.PressReleaseService{}.ListAll(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "press releases", list)
	})(ctx)
}

func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if ok, _ := permission.UserHas(c, user, "press_release.manage"); !ok {
			return c.Error(403, "akses ditolak")
		}
		form, err := contentform.Read(c, "cover")
		if err != nil {
			return c.Error(400, err.Error())
		}
		in, err := services.PressReleaseInputFromForm(form.Values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		if err := in.Validate(true); err != nil {
			return c.Error(400, err.Error())
		}
		if form.Image != nil {
			url, err := form.Upload(c, "press_releases/covers")
			if err != nil {
				return c.Error(500, err.Error())
			}
			in.CoverURL = &url
		}
		p, err := services.PressReleaseService{}.Create(c.Request.Context(), in, user.ID)
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "create", "press_release", p.ID,
			"Membuat press release "+p.Title, c.Request.RemoteAddr)
		return c.Success(201, "press release created", p)
	})(ctx)
}
