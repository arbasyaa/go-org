package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// ErrContentNotFound dipetakan route ke 404.
var ErrContentNotFound = errors.New("data tidak ditemukan")

type PressReleaseService struct{}

// PressReleaseInput: pointer nil = field tidak dikirim (tidak diubah saat PUT).
type PressReleaseInput struct {
	Title, Slug, Excerpt, Content, Category *string
	Published                               *bool
	// CoverURL diisi route setelah upload; RemoveCover mengosongkannya.
	CoverURL    *string
	RemoveCover bool
}

func PressReleaseInputFromForm(v map[string]string) (PressReleaseInput, error) {
	in := PressReleaseInput{
		Title: formStr(v, "title"), Slug: formStr(v, "slug"), Excerpt: formStr(v, "excerpt"),
		Content: formStr(v, "content"), Category: formStr(v, "category"),
	}
	var err error
	if in.Published, err = formBool(v, "published"); err != nil {
		return in, err
	}
	rc, err := formBool(v, "remove_cover")
	if err != nil {
		return in, err
	}
	in.RemoveCover = rc != nil && *rc
	return in, nil
}

func (in *PressReleaseInput) normalize() {
	if in.Content != nil {
		c := SanitizeHTML(*in.Content)
		in.Content = &c
	}
}

func (in PressReleaseInput) validate(creating bool) error {
	if creating && (in.Title == nil || *in.Title == "") {
		return fmt.Errorf("judul wajib diisi")
	}
	if in.Title != nil && (*in.Title == "" || len(*in.Title) > 200) {
		return fmt.Errorf("judul wajib diisi, maksimal 200 karakter")
	}
	if in.Excerpt != nil && len(*in.Excerpt) > 500 {
		return fmt.Errorf("ringkasan maksimal 500 karakter")
	}
	if in.Category != nil && len(*in.Category) > 50 {
		return fmt.Errorf("kategori maksimal 50 karakter")
	}
	return nil
}

// Validate dipanggil route sebelum mengunggah gambar (murah dulu, mahal kemudian).
func (in PressReleaseInput) Validate(creating bool) error { return in.validate(creating) }

func (PressReleaseService) slugTaken(ctx context.Context, exceptID int64) func(string) (bool, error) {
	return func(c string) (bool, error) {
		list, err := orm.Objects[models.PressRelease](ctx).Filter("slug", c).All()
		if err != nil {
			return false, err
		}
		for _, p := range list {
			if p.ID != exceptID {
				return true, nil
			}
		}
		return false, nil
	}
}

func (s PressReleaseService) Create(ctx context.Context, in PressReleaseInput, userID int64) (*models.PressRelease, error) {
	if err := in.validate(true); err != nil {
		return nil, err
	}
	in.normalize()
	base := ""
	if in.Slug != nil {
		base = Slugify(*in.Slug, 220)
	}
	if base == "" {
		base = Slugify(*in.Title, 220)
	}
	slug, err := UniqueSlug(base, 220, s.slugTaken(ctx, 0))
	if err != nil {
		return nil, err
	}
	p := &models.PressRelease{Title: *in.Title, Slug: slug, Category: "Siaran Pers", CreatedByID: &userID}
	if in.Excerpt != nil {
		p.Excerpt = *in.Excerpt
	}
	if in.Content != nil {
		p.Content = *in.Content
	}
	if in.Category != nil && *in.Category != "" {
		p.Category = *in.Category
	}
	if in.CoverURL != nil {
		p.CoverURL = *in.CoverURL
	}
	if in.Published != nil && *in.Published {
		now := time.Now()
		p.Published, p.PublishedAt = true, &now
	}
	return orm.Create(ctx, p)
}

func (s PressReleaseService) Update(ctx context.Context, id int64, in PressReleaseInput) (*models.PressRelease, error) {
	if err := in.validate(false); err != nil {
		return nil, err
	}
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	in.normalize()
	vals := map[string]any{}
	if in.Title != nil {
		vals["title"] = *in.Title
	}
	if in.Slug != nil && *in.Slug != "" {
		slug, err := UniqueSlug(Slugify(*in.Slug, 220), 220, s.slugTaken(ctx, id))
		if err != nil {
			return nil, err
		}
		vals["slug"] = slug
	}
	if in.Excerpt != nil {
		vals["excerpt"] = *in.Excerpt
	}
	if in.Content != nil {
		vals["content"] = *in.Content
	}
	if in.Category != nil && *in.Category != "" {
		vals["category"] = *in.Category
	}
	if in.CoverURL != nil {
		vals["cover_url"] = *in.CoverURL
	} else if in.RemoveCover {
		vals["cover_url"] = ""
	}
	if in.Published != nil {
		vals["published"] = *in.Published
		if *in.Published && cur.PublishedAt == nil {
			vals["published_at"] = time.Now()
		}
	}
	if len(vals) == 0 {
		return cur, nil
	}
	return orm.UpdateByID[models.PressRelease](ctx, id, vals)
}

func (PressReleaseService) Get(ctx context.Context, id int64) (*models.PressRelease, error) {
	p, err := orm.GetByID[models.PressRelease](ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	return p, err
}

func (PressReleaseService) ListAll(ctx context.Context) ([]*models.PressRelease, error) {
	return orm.Objects[models.PressRelease](ctx).OrderBy("-created_at", "-id").All()
}

// ListPublished: hanya published, terbaru dulu. limit <=0 = 50 (cap 50).
func (PressReleaseService) ListPublished(ctx context.Context, limit int) ([]*models.PressRelease, error) {
	if limit <= 0 || limit > 50 {
		limit = 50
	}
	return orm.Objects[models.PressRelease](ctx).Filter("published", true).
		OrderBy("-published_at", "-id").Limit(limit).All()
}

func (PressReleaseService) GetPublishedBySlug(ctx context.Context, slug string) (*models.PressRelease, error) {
	p, err := orm.Objects[models.PressRelease](ctx).Filter("slug", slug).Filter("published", true).Get()
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	return p, err
}

func (s PressReleaseService) Delete(ctx context.Context, id int64) error {
	if _, err := s.Get(ctx, id); err != nil {
		return err
	}
	_, err := orm.DeleteByID[models.PressRelease](ctx, id)
	return err
}
