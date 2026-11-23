package services

import (
	"context"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

type OfficialService struct{}

// OfficialView = bentuk respons API pengurus di landing page. Sumbernya tabel
// `user`: satu orang satu baris, supaya menonaktifkan / menghapus akun langsung
// menghilangkan orang itu dari landing (tidak ada salinan yang bisa basi).
type OfficialView struct {
	ID       int64  `json:"id"`
	Division string `json:"division"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Origin   string `json:"origin"`
	Avatar   string `json:"avatar_url"`
}

// ListActive: user aktif yang punya jabatan dan divisi, dikelompokkan nanti di
// klien per `division`. Urutan: division_id lalu id (urutan tampil stabil tanpa
// kolom sort_order terpisah yang harus diisi ulang admin).
func (OfficialService) ListActive(ctx context.Context) ([]OfficialView, error) {
	users, err := orm.Objects[models.User](ctx).Filter("status", "active").OrderBy("division_id", "id").All()
	if err != nil {
		return nil, err
	}
	divs, err := orm.Objects[models.Division](ctx).All()
	if err != nil {
		return nil, err
	}
	names := make(map[int64]string, len(divs))
	for _, d := range divs {
		names[d.ID] = d.Name
	}
	out := make([]OfficialView, 0, len(users))
	for _, u := range users {
		// Tanpa jabatan/divisi = bukan pengurus (mis. akun sistem).
		if u.Jabatan == "" || u.DivisionID == 0 {
			continue
		}
		out = append(out, OfficialView{
			ID:       u.ID,
			Division: names[u.DivisionID],
			Name:     u.FullName,
			Role:     u.Jabatan,
			Origin:   himpunanName(ctx, u),
			Avatar:   u.AvatarURL,
		})
	}
	return out, nil
}
