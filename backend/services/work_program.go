package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

type WorkProgramService struct{}

type WorkProgramInput struct {
	Name, Description, Cadence *string
	SortOrder                  *int
	IsActive                   *bool
}

func WorkProgramInputFromForm(v map[string]string) (WorkProgramInput, error) {
	in := WorkProgramInput{
		Name: formStr(v, "name"), Description: formStr(v, "description"), Cadence: formStr(v, "cadence"),
	}
	var err error
	if s := formStr(v, "sort_order"); s != nil {
		n, perr := strconv.Atoi(*s)
		if perr != nil {
			return in, fmt.Errorf("sort_order harus berupa bilangan bulat")
		}
		in.SortOrder = &n
	}
	if in.IsActive, err = formBool(v, "is_active"); err != nil {
		return in, err
	}
	return in, nil
}

func (in WorkProgramInput) Validate(creating bool) error {
	if creating && (in.Name == nil || *in.Name == "") {
		return fmt.Errorf("nama wajib diisi")
	}
	if in.Name != nil && (*in.Name == "" || len(*in.Name) > 150) {
		return fmt.Errorf("nama wajib diisi, maksimal 150 karakter")
	}
	if in.Cadence != nil && len(*in.Cadence) > 50 {
		return fmt.Errorf("periode maksimal 50 karakter")
	}
	return nil
}

func (WorkProgramService) Create(ctx context.Context, in WorkProgramInput) (*models.WorkProgram, error) {
	if err := in.Validate(true); err != nil {
		return nil, err
	}
	m := &models.WorkProgram{Name: *in.Name, IsActive: true}
	if in.Description != nil {
		m.Description = *in.Description
	}
	if in.Cadence != nil {
		m.Cadence = *in.Cadence
	}
	if in.SortOrder != nil {
		m.SortOrder = *in.SortOrder
	}
	if in.IsActive != nil {
		m.IsActive = *in.IsActive
	}
	return orm.Create(ctx, m)
}

func (s WorkProgramService) Update(ctx context.Context, id int64, in WorkProgramInput) (*models.WorkProgram, error) {
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
	if in.Description != nil {
		vals["description"] = *in.Description
	}
	if in.Cadence != nil {
		vals["cadence"] = *in.Cadence
	}
	if in.SortOrder != nil {
		vals["sort_order"] = *in.SortOrder
	}
	if in.IsActive != nil {
		vals["is_active"] = *in.IsActive
	}
	if len(vals) == 0 {
		return cur, nil
	}
	return orm.UpdateByID[models.WorkProgram](ctx, id, vals)
}

func (WorkProgramService) Get(ctx context.Context, id int64) (*models.WorkProgram, error) {
	m, err := orm.GetByID[models.WorkProgram](ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	return m, err
}

func (WorkProgramService) ListAll(ctx context.Context) ([]*models.WorkProgram, error) {
	return orm.Objects[models.WorkProgram](ctx).OrderBy("sort_order", "id").All()
}

func (WorkProgramService) ListActive(ctx context.Context) ([]*models.WorkProgram, error) {
	return orm.Objects[models.WorkProgram](ctx).Filter("is_active", true).OrderBy("sort_order", "id").All()
}

func (s WorkProgramService) Delete(ctx context.Context, id int64) error {
	if _, err := s.Get(ctx, id); err != nil {
		return err
	}
	_, err := orm.DeleteByID[models.WorkProgram](ctx, id)
	return err
}
