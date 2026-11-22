package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

type WorkProgramService struct{}

const (
	WorkProgramCategoryProgram = "program_kerja"
	WorkProgramCategoryAgenda  = "agenda"
	WorkProgramStatusUpcoming  = "upcoming"
	WorkProgramStatusDone      = "done"
)

// WorkProgramView = bentuk respons API: model + tanggal "YYYY-MM-DD" (atau null)
// + division_name. Field luar menimpa field model dengan nama JSON sama.
type WorkProgramView struct {
	models.WorkProgram
	StartDate    *string `json:"start_date"`
	EndDate      *string `json:"end_date"`
	DivisionName string  `json:"division_name"`
}

func fmtDate(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format("2006-01-02")
	return &s
}

func (s WorkProgramService) views(ctx context.Context, list []*models.WorkProgram) ([]*WorkProgramView, error) {
	names := map[int64]string{}
	need := false
	for _, p := range list {
		if p.DivisionID != nil {
			need = true
			break
		}
	}
	if need {
		divs, err := orm.Objects[models.Division](ctx).All()
		if err != nil {
			return nil, err
		}
		for _, d := range divs {
			names[d.ID] = d.Name
		}
	}
	out := make([]*WorkProgramView, 0, len(list))
	for _, p := range list {
		v := &WorkProgramView{WorkProgram: *p, StartDate: fmtDate(p.StartDate), EndDate: fmtDate(p.EndDate)}
		if p.DivisionID != nil {
			v.DivisionName = names[*p.DivisionID]
		}
		out = append(out, v)
	}
	return out, nil
}

func (s WorkProgramService) view(ctx context.Context, p *models.WorkProgram) (*WorkProgramView, error) {
	vs, err := s.views(ctx, []*models.WorkProgram{p})
	if err != nil {
		return nil, err
	}
	return vs[0], nil
}

// Slug/StartDate/EndDate/DivisionID bertipe string mentah: "" = kosongkan (null).
type WorkProgramInput struct {
	Name, Description, Cadence *string
	SortOrder                  *int
	IsActive                   *bool
	Slug, Category, Status     *string
	DivisionID                 *string
	StartDate, EndDate         *string
	Location, Host             *string
}

func WorkProgramInputFromForm(v map[string]string) (WorkProgramInput, error) {
	in := WorkProgramInput{
		Name: formStr(v, "name"), Description: formStr(v, "description"), Cadence: formStr(v, "cadence"),
		Slug: formStr(v, "slug"), Category: formStr(v, "category"), Status: formStr(v, "status"),
		DivisionID: formStr(v, "division_id"), StartDate: formStr(v, "start_date"), EndDate: formStr(v, "end_date"),
		Location: formStr(v, "location"), Host: formStr(v, "host"),
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

func parseProgramDate(s *string, label string) (*time.Time, bool, error) {
	if s == nil {
		return nil, false, nil
	}
	if *s == "" {
		return nil, true, nil
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return nil, true, fmt.Errorf("%s tidak valid (format YYYY-MM-DD)", label)
	}
	return &t, true, nil
}

func parseProgramDivision(s *string) (*int64, bool, error) {
	if s == nil {
		return nil, false, nil
	}
	if *s == "" {
		return nil, true, nil
	}
	n, err := strconv.ParseInt(*s, 10, 64)
	if err != nil || n <= 0 {
		return nil, true, fmt.Errorf("divisi tidak valid")
	}
	return &n, true, nil
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
	if in.Category != nil && *in.Category != WorkProgramCategoryProgram && *in.Category != WorkProgramCategoryAgenda {
		return fmt.Errorf("kategori harus program_kerja atau agenda")
	}
	if in.Status != nil && *in.Status != WorkProgramStatusUpcoming && *in.Status != WorkProgramStatusDone {
		return fmt.Errorf("status harus upcoming atau done")
	}
	if in.Location != nil && len(*in.Location) > 200 {
		return fmt.Errorf("lokasi maksimal 200 karakter")
	}
	if in.Host != nil && len(*in.Host) > 200 {
		return fmt.Errorf("tuan rumah maksimal 200 karakter")
	}
	if in.Slug != nil && len(*in.Slug) > 180 {
		return fmt.Errorf("slug maksimal 180 karakter")
	}
	if _, _, err := parseProgramDivision(in.DivisionID); err != nil {
		return err
	}
	st, _, err := parseProgramDate(in.StartDate, "tanggal mulai")
	if err != nil {
		return err
	}
	en, _, err := parseProgramDate(in.EndDate, "tanggal selesai")
	if err != nil {
		return err
	}
	if st != nil && en != nil && en.Before(*st) {
		return fmt.Errorf("tanggal selesai tidak boleh sebelum tanggal mulai")
	}
	return nil
}

func (WorkProgramService) slugTaken(ctx context.Context, exceptID int64) func(string) (bool, error) {
	return func(c string) (bool, error) {
		list, err := orm.Objects[models.WorkProgram](ctx).Filter("slug", c).All()
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

func (WorkProgramService) checkDivision(ctx context.Context, id *int64) error {
	if id == nil {
		return nil
	}
	if _, err := orm.GetByID[models.Division](ctx, *id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("divisi tidak ditemukan")
		}
		return err
	}
	return nil
}

func (s WorkProgramService) Create(ctx context.Context, in WorkProgramInput) (*WorkProgramView, error) {
	if err := in.Validate(true); err != nil {
		return nil, err
	}
	m := &models.WorkProgram{Name: *in.Name, IsActive: true,
		Category: WorkProgramCategoryProgram, Status: WorkProgramStatusUpcoming}
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
	if in.Category != nil {
		m.Category = *in.Category
	}
	if in.Status != nil {
		m.Status = *in.Status
	}
	if in.Location != nil {
		m.Location = *in.Location
	}
	if in.Host != nil {
		m.Host = *in.Host
	}
	m.DivisionID, _, _ = parseProgramDivision(in.DivisionID)
	if err := s.checkDivision(ctx, m.DivisionID); err != nil {
		return nil, err
	}
	m.StartDate, _, _ = parseProgramDate(in.StartDate, "")
	m.EndDate, _, _ = parseProgramDate(in.EndDate, "")
	base := *in.Name
	if in.Slug != nil && *in.Slug != "" {
		base = *in.Slug
	}
	slug, err := UniqueSlug(Slugify(base, 170), 170, s.slugTaken(ctx, 0))
	if err != nil {
		return nil, err
	}
	m.Slug = slug
	created, err := orm.Create(ctx, m)
	if err != nil {
		return nil, err
	}
	return s.view(ctx, created)
}

func (s WorkProgramService) Update(ctx context.Context, id int64, in WorkProgramInput) (*WorkProgramView, error) {
	if err := in.Validate(false); err != nil {
		return nil, err
	}
	cur, err := s.get(ctx, id)
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
	if in.Category != nil {
		vals["category"] = *in.Category
	}
	if in.Status != nil {
		vals["status"] = *in.Status
	}
	if in.Location != nil {
		vals["location"] = *in.Location
	}
	if in.Host != nil {
		vals["host"] = *in.Host
	}
	if div, set, _ := parseProgramDivision(in.DivisionID); set {
		if err := s.checkDivision(ctx, div); err != nil {
			return nil, err
		}
		if div == nil {
			vals["division_id"] = nil
		} else {
			vals["division_id"] = *div
		}
	}
	st, stSet, _ := parseProgramDate(in.StartDate, "")
	en, enSet, _ := parseProgramDate(in.EndDate, "")
	effStart, effEnd := cur.StartDate, cur.EndDate
	if stSet {
		effStart = st
		vals["start_date"] = dateOrNil(st)
	}
	if enSet {
		effEnd = en
		vals["end_date"] = dateOrNil(en)
	}
	if effStart != nil && effEnd != nil && effEnd.Before(*effStart) {
		return nil, fmt.Errorf("tanggal selesai tidak boleh sebelum tanggal mulai")
	}
	if in.Slug != nil && *in.Slug != "" {
		slug, err := UniqueSlug(Slugify(*in.Slug, 170), 170, s.slugTaken(ctx, id))
		if err != nil {
			return nil, err
		}
		vals["slug"] = slug
	}
	if len(vals) == 0 {
		return s.view(ctx, cur)
	}
	updated, err := orm.UpdateByID[models.WorkProgram](ctx, id, vals)
	if err != nil {
		return nil, err
	}
	return s.view(ctx, updated)
}

func dateOrNil(t *time.Time) any {
	if t == nil {
		return nil
	}
	return *t
}

func (WorkProgramService) get(ctx context.Context, id int64) (*models.WorkProgram, error) {
	m, err := orm.GetByID[models.WorkProgram](ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	return m, err
}

func (s WorkProgramService) Get(ctx context.Context, id int64) (*WorkProgramView, error) {
	m, err := s.get(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.view(ctx, m)
}

func (s WorkProgramService) ListAll(ctx context.Context) ([]*WorkProgramView, error) {
	list, err := orm.Objects[models.WorkProgram](ctx).OrderBy("sort_order", "id").All()
	if err != nil {
		return nil, err
	}
	return s.views(ctx, list)
}

// WorkProgramFilter: filter daftar publik. Limit <= 0 = tanpa batas.
type WorkProgramFilter struct {
	Status, Category string
	Limit            int
}

// SortWorkPrograms: upcoming dulu (start_date ASC, NULL terakhir), lalu done
// (start_date DESC, NULL terakhir), lalu sort_order, id.
func SortWorkPrograms(list []*models.WorkProgram) {
	rank := func(p *models.WorkProgram) int {
		if p.Status == WorkProgramStatusDone {
			return 1
		}
		return 0
	}
	sort.SliceStable(list, func(i, j int) bool {
		a, b := list[i], list[j]
		if ra, rb := rank(a), rank(b); ra != rb {
			return ra < rb
		}
		if (a.StartDate == nil) != (b.StartDate == nil) {
			return a.StartDate != nil
		}
		if a.StartDate != nil && !a.StartDate.Equal(*b.StartDate) {
			if rank(a) == 0 {
				return a.StartDate.Before(*b.StartDate)
			}
			return a.StartDate.After(*b.StartDate)
		}
		if a.SortOrder != b.SortOrder {
			return a.SortOrder < b.SortOrder
		}
		return a.ID < b.ID
	})
}

// ListPublic: program aktif terurut + filter. total = jumlah setelah filter
// status/category, sebelum limit.
func (s WorkProgramService) ListPublic(ctx context.Context, f WorkProgramFilter) ([]*WorkProgramView, int, error) {
	list, err := orm.Objects[models.WorkProgram](ctx).Filter("is_active", true).OrderBy("sort_order", "id").All()
	if err != nil {
		return nil, 0, err
	}
	kept := list[:0]
	for _, p := range list {
		if f.Status != "" && p.Status != f.Status {
			continue
		}
		if f.Category != "" && p.Category != f.Category {
			continue
		}
		kept = append(kept, p)
	}
	SortWorkPrograms(kept)
	total := len(kept)
	if f.Limit > 0 && len(kept) > f.Limit {
		kept = kept[:f.Limit]
	}
	vs, err := s.views(ctx, kept)
	return vs, total, err
}

func (s WorkProgramService) GetActiveBySlug(ctx context.Context, slug string) (*WorkProgramView, error) {
	m, err := orm.Objects[models.WorkProgram](ctx).Filter("slug", strings.TrimSpace(slug)).Filter("is_active", true).Get()
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrContentNotFound
	}
	if err != nil {
		return nil, err
	}
	return s.view(ctx, m)
}

func (s WorkProgramService) Delete(ctx context.Context, id int64) error {
	if _, err := s.get(ctx, id); err != nil {
		return err
	}
	_, err := orm.DeleteByID[models.WorkProgram](ctx, id)
	return err
}
