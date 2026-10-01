package id

import (
	"io"
	"strconv"
	"strings"
	"time"

	"backend/internal/auth"
	"backend/internal/idlist"
	"backend/internal/permission"
	"backend/internal/storageutil"
	"backend/internal/timeutil"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/orm"
	"github.com/lrndwy/gokil/views"
)

func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "events.view")
		if !ok {
			return c.Error(403, "forbidden")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "invalid id")
		}
		canViewAll, _ := permission.UserHas(c, user, "events.view_all")
		e, err := services.EventService{}.GetForUser(c.Request.Context(), id, user, canViewAll)
		if err == services.ErrForbidden {
			return c.Error(403, "forbidden")
		}
		if err != nil {
			return c.NotFound()
		}
		return c.Success(200, "event", e)
	})(ctx)
}

// canEditEvent: event sendiri, divisi penyelenggara, atau events.view_all.
func canEditEvent(c *views.Context, user *auth.User, eventID int64) (bool, error) {
	e, err := orm.GetByID[models.Event](c.Request.Context(), eventID)
	if err != nil {
		return false, err
	}
	if ok, err := services.CanManageEvent(c.Request.Context(), e, user); err != nil || ok {
		return ok, err
	}
	return permission.UserHas(c, user, "events.view_all")
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "events.edit")
		if !ok {
			return c.Error(403, "forbidden")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "invalid id")
		}
		allowed, err := canEditEvent(c, user, id)
		if err != nil {
			return c.Error(404, "event not found")
		}
		if !allowed {
			return c.Error(403, "forbidden")
		}

		values := map[string]any{}
		ct := c.Request.Header.Get("Content-Type")
		if strings.HasPrefix(ct, "multipart/form-data") {
			if err := c.ParseMultipart(20 << 20); err != nil {
				return c.Error(400, err.Error())
			}
			if v := c.Request.FormValue("title"); v != "" {
				values["title"] = v
			}
			if v := c.Request.FormValue("description"); v != "" {
				values["description"] = v
			}
			if v := c.Request.FormValue("location"); v != "" {
				values["location"] = v
			}
			if v := c.Request.FormValue("start_time"); v != "" {
				start, err := timeutil.ParseFlexible(v)
				if err != nil {
					return c.Error(400, "invalid start_time")
				}
				values["start_time"] = start
			}
			if raw, ok := c.Request.Form["end_time"]; ok {
				v := ""
				if len(raw) > 0 {
					v = raw[0]
				}
				// Kosong = batas selesai dihapus; service mengisi akhir hari mulai.
				if strings.TrimSpace(v) == "" {
					values["end_time"] = time.Time{}
				} else if end, err := timeutil.ParseFlexible(v); err == nil {
					values["end_time"] = end
				} else {
					return c.Error(400, "invalid end_time")
				}
			}
			values["allow_permission"] = c.Request.FormValue("allow_permission") == "true"
			if v := c.Request.FormValue("link_url"); v != "" {
				values["link_url"] = v
			}
			if v := c.Request.FormValue("audience"); v != "" {
				values["audience"] = v
			}
			if _, ok := c.Request.Form["target_division_ids"]; ok {
				values["target_division_ids"] = idlist.Parse(c.Request.Form["target_division_ids"])
			}
			if _, ok := c.Request.Form["target_role_ids"]; ok {
				values["target_role_ids"] = idlist.Parse(c.Request.Form["target_role_ids"])
			}
			if v := c.Request.FormValue("division_id"); v != "" {
				divID, _ := strconv.ParseInt(v, 10, 64)
				if divID > 0 {
					values["division_id"] = divID
				} else {
					values["division_id"] = nil
				}
			}
			banner, hdr, _ := c.FormFile("banner")
			if banner != nil && hdr != nil {
				defer banner.Close()
				data, err := io.ReadAll(banner)
				if err != nil {
					return c.Error(500, err.Error())
				}
				key := storageutil.Key("events/banners", "banner"+fileExt(hdr.Filename))
				url, err := storageutil.Upload(c.Request.Context(), key, data, hdr.Header.Get("Content-Type"))
				if err != nil {
					return c.Error(500, err.Error())
				}
				values["banner_url"] = url
			}
		} else {
			var body map[string]any
			if err := c.Bind(&body); err != nil {
				return c.Error(400, err.Error())
			}
			if startRaw, ok := body["start_time"].(string); ok && startRaw != "" {
				start, err := timeutil.ParseFlexible(startRaw)
				if err != nil {
					return c.Error(400, "invalid start_time")
				}
				body["start_time"] = start
			}
			if endRaw, ok := body["end_time"].(string); ok {
				// Kosong = batas selesai dihapus; service mengisi akhir hari mulai.
				if strings.TrimSpace(endRaw) == "" {
					body["end_time"] = time.Time{}
				} else if end, err := timeutil.ParseFlexible(endRaw); err == nil {
					body["end_time"] = end
				} else {
					return c.Error(400, "invalid end_time")
				}
			}
			// JSON mengirim array angka; map[string]any menyimpannya sebagai []any.
			for _, key := range []string{"target_division_ids", "target_role_ids"} {
				if raw, ok := body[key]; ok {
					body[key] = idlist.FromAny(raw)
				}
			}
			values = body
		}

		e, err := services.EventService{}.Update(c.Request.Context(), id, values)
		if err != nil {
			return c.Error(400, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "event", id,
			"Memperbarui event", c.Request.RemoteAddr)
		return c.Success(200, "event updated", e)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "events.delete")
		if !ok {
			return c.Error(403, "forbidden")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "invalid id")
		}
		allowed, err := canEditEvent(c, user, id)
		if err != nil {
			return c.Error(404, "event not found")
		}
		if !allowed {
			return c.Error(403, "forbidden")
		}
		if err := (services.EventService{}).Delete(c.Request.Context(), id); err != nil {
			return c.Error(500, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "event", id,
			"Menghapus event", c.Request.RemoteAddr)
		return c.Success(200, "event deleted", nil)
	})(ctx)
}

func fileExt(name string) string {
	if i := strings.LastIndex(name, "."); i >= 0 {
		return name[i:]
	}
	return ""
}
