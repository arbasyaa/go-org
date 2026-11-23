package himpunan

import (
	"backend/internal/auth"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /himpunan/options — daftar ringkas (id + label) untuk dropdown form yang
// butuh menautkan user ke himpunan. Boleh diakses semua user login: profil
// anggota memakai endpoint ini untuk memilih asal himpunannya sendiri, jadi
// tidak digerbangi `himpunan.manage` (itu untuk CRUD penuh).
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		list, err := services.HimpunanService{}.ListActive(c.Request.Context())
		if err != nil {
			return c.Error(500, err.Error())
		}
		out := make([]map[string]any, 0, len(list))
		for _, h := range list {
			label := h.ShortLabel
			if label == "" {
				label = h.Name
			}
			out = append(out, map[string]any{
				"id": h.ID, "label": label, "name": h.Name, "institution": h.Institution,
			})
		}
		return c.Success(200, "himpunan options", out)
	})(ctx)
}
