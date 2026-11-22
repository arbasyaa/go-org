package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strconv"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

type HimpunanService struct{}

var reEmail = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

type HimpunanInput struct {
	Name, ShortLabel, Institution, City, Address, Email *string
	SortOrder, Region                                   *int
	IsActive                                            *bool
	LogoURL                                             *string
	RemoveImage                                         bool
}

func HimpunanInputFromForm(v map[string]string) (HimpunanInput, error) {
	in := HimpunanInput{
		Name: formStr(v, "name"), ShortLabel: formStr(v, "short_label"), Institution: formStr(v, "institution"),
		City: formStr(v, "city"), Address: formStr(v, "address"), Email: formStr(v, "email"),
	}
	var err error
	if s := formStr(v, "sort_order"); s != nil {
		n, perr := strconv.Atoi(*s)
		if perr != nil {
			return in, fmt.Errorf("sort_order harus berupa bilangan bulat")
		}
		in.SortOrder = &n
	}
	if s := formStr(v, "region"); s != nil {
		n, perr := strconv.Atoi(*s)
		if perr != nil {
			return in, fmt.Errorf("region harus berupa bilangan bulat")
		}
		in.Region = &n
	}
	if in.IsActive, err = formBool(v, "is_active"); err != nil {
		return in, err
	}
	rc, err := formBool(v, "remove_image")
	if err != nil {
		return in, err
	}
	in.RemoveImage = rc != nil && *rc
	return in, nil
}

// Validate dipanggil route sebelum upload logo.
func (in HimpunanInput) Validate(creating bool) error {
	if creating && (in.Name == nil || *in.Name == "") {
		return fmt.Errorf("nama wajib diisi")
	}
	if in.Name != nil && (*in.Name == "" || len(*in.Name) > 150) {
		return fmt.Errorf("nama wajib diisi, maksimal 150 karakter")
	}
	if in.ShortLabel != nil && len(*in.ShortLabel) > 60 {
		return fmt.Errorf("label singkat maksimal 60 karakter")
	}
	if in.Institution != nil && len(*in.Institution) > 200 {
		return fmt.Errorf("instansi maksimal 200 karakter")
	}
	if in.City != nil && len(*in.City) > 100 {
		return fmt.Errorf("kota maksimal 100 karakter")
	}
	if in.Region != nil && (*in.Region < 0 || *in.Region > 6) {
		return fmt.Errorf("daerah harus 1–6")
	}
	if in.Email != nil && *in.Email != "" && (len(*in.Email) > 150 || !reEmail.MatchString(*in.Email)) {
		return fmt.Errorf("format email tidak valid")
	}
	return nil
}

func (HimpunanService) Create(ctx context.Context, in HimpunanInput) (*models.Himpunan, error) {
	if err := in.Validate(true); err != nil {
		return nil, err
	}
	m := &models.Himpunan{Name: *in.Name, IsActive: true}
	if in.ShortLabel != nil {
		m.ShortLabel = *in.ShortLabel
	}
	if in.Institution != nil {
		m.Institution = *in.Institution
	}
	if in.City != nil {
		m.City = *in.City
	}
	if in.Address != nil {
		m.Address = *in.Address
	}
	if in.Email != nil {
		m.Email = *in.Email
	}
	if in.SortOrder != nil {
		m.SortOrder = *in.SortOrder
	}
	if in.Region != nil {
		m.Region = *in.Region
	}
	if in.IsActive != nil {
		m.IsActive = *in.IsActive
	}
	if in.LogoURL != nil {
		m.LogoURL = *in.LogoURL
	}
	return orm.Create(ctx, m)
}

func (s HimpunanService) Update(ctx context.Context, id int64, in HimpunanInput) (*models.Himpunan, error) {
	if err := in.Validate(false); err != nil {
		return nil, err
	}
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	vals := map[string]any{}
	if in.Name != nil {
		vals["name"] = *in.Name
	}
	if in.ShortLabel != nil {
		vals["short_label"] = *in.ShortLabel
	}
	if in.Institution != nil {
		vals["institution"] = *in.Institution
	}
	if in.City != nil {
		vals["city"] = *in.City
	}
	if in.Address != nil {
		vals["address"] = *in.Address
	}
	if in.Email != nil {
		vals["email"] = *in.Email
	}
	if in.SortOrder != nil {
		vals["sort_order"] = *in.SortOrder
	}
	if in.Region != nil {
		vals["region"] = *in.Region
	}
	if in.IsActive != nil {
		vals["is_active"] = *in.IsActive
	}
	if in.LogoURL != nil {
		vals["logo_url"] = *in.LogoURL
	} else if in.RemoveImage {
		vals["logo_url"] = ""
	}
	if len(vals) == 0 {
		return cur, nil
	}
	return orm.UpdateByID[models.Himpunan](ctx, id, vals)
}

func (HimpunanService) Get(ctx context.Context, id int64) (*models.Himpunan, error) {
	m, err := orm.GetByID[models.Himpunan](ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	return m, err
}

func (HimpunanService) ListAll(ctx context.Context) ([]*models.Himpunan, error) {
	return orm.Objects[models.Himpunan](ctx).OrderBy("sort_order", "id").All()
}

func (HimpunanService) ListActive(ctx context.Context) ([]*models.Himpunan, error) {
	return orm.Objects[models.Himpunan](ctx).Filter("is_active", true).OrderBy("sort_order", "id").All()
}

func (s HimpunanService) Delete(ctx context.Context, id int64) error {
	if _, err := s.Get(ctx, id); err != nil {
		return err
	}
	_, err := orm.DeleteByID[models.Himpunan](ctx, id)
	return err
}
