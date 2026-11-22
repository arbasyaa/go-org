package landing_sections

import (
	"encoding/json"
	"strings"

	"backend/internal/auth"
	"backend/internal/permission"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(putLandingSections)(ctx)
}

func putLandingSections(ctx *views.Context) error {
	user, _ := auth.CurrentUser(ctx.Request.Context())
	ok, err := permission.UserHas(ctx, user, "landing.manage")
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	if !ok {
		return ctx.Error(403, "akses ditolak")
	}
	var raw string
	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var body map[string]any
		if err := ctx.Bind(&body); err != nil {
			return ctx.Error(400, err.Error())
		}
		v, present := body["landing_sections"]
		if !present {
			return ctx.Error(400, "landing_sections wajib diisi")
		}
		switch t := v.(type) {
		case string:
			raw = t
		case map[string]any:
			b, _ := json.Marshal(t)
			raw = string(b)
		default:
			return ctx.Error(400, "landing_sections harus berupa objek JSON")
		}
	} else {
		if err := ctx.ParseMultipart(1 << 20); err != nil {
			return ctx.Error(400, err.Error())
		}
		if _, present := ctx.Request.Form["landing_sections"]; !present {
			return ctx.Error(400, "landing_sections wajib diisi")
		}
		raw = ctx.Request.FormValue("landing_sections")
	}
	if _, err := services.ValidateLandingSections(raw); err != nil {
		return ctx.Error(400, err.Error())
	}
	s, err := services.SettingsService{}.SetLandingSections(ctx.Request.Context(), raw)
	if err != nil {
		return ctx.Error(500, err.Error())
	}
	services.LogActivity(ctx.Request.Context(), user.ID, "update", "settings", 0,
		"Memperbarui section landing page", ctx.Request.RemoteAddr)
	return ctx.Success(200, "settings", s)
}
