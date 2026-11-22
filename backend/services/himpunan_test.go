package services

import (
	"testing"
	"time"

	"backend/models"
)

func sp(s string) *string { return &s }

func TestHimpunanValidate(t *testing.T) {
	if err := (HimpunanInput{}).Validate(true); err == nil {
		t.Error("create tanpa nama harus gagal")
	}
	if err := (HimpunanInput{Name: sp("")}).Validate(false); err == nil {
		t.Error("nama kosong harus gagal")
	}
	if err := (HimpunanInput{Name: sp("HIMA"), Email: sp("bukan-email")}).Validate(true); err == nil {
		t.Error("email invalid harus gagal")
	}
	if err := (HimpunanInput{Name: sp("HIMA"), Email: sp("a@b.co")}).Validate(true); err != nil {
		t.Errorf("email valid: %v", err)
	}
	if err := (HimpunanInput{Name: sp("HIMA"), Email: sp("")}).Validate(true); err != nil {
		t.Errorf("email kosong boleh: %v", err)
	}
	for _, r := range []int{-1, 7} {
		if err := (HimpunanInput{Name: sp("HIMA"), Region: &r}).Validate(true); err == nil {
			t.Errorf("region %d harus gagal", r)
		}
	}
	for _, r := range []int{0, 1, 6} {
		if err := (HimpunanInput{Name: sp("HIMA"), Region: &r}).Validate(true); err != nil {
			t.Errorf("region %d valid: %v", r, err)
		}
	}
	if err := (HimpunanInput{}).Validate(false); err != nil {
		t.Errorf("update kosong boleh: %v", err)
	}
}

func TestHimpunanInputFromForm(t *testing.T) {
	in, err := HimpunanInputFromForm(map[string]string{"name": " X ", "sort_order": "3", "region": "4", "is_active": "false"})
	if err != nil || *in.Name != "X" || *in.SortOrder != 3 || *in.Region != 4 || *in.IsActive {
		t.Fatalf("got %+v err %v", in, err)
	}
	if _, err := HimpunanInputFromForm(map[string]string{"sort_order": "x"}); err == nil {
		t.Error("sort_order invalid harus gagal")
	}
	if _, err := HimpunanInputFromForm(map[string]string{"region": "x"}); err == nil {
		t.Error("region invalid harus gagal")
	}
}

func TestWorkProgramValidate(t *testing.T) {
	if err := (WorkProgramInput{}).Validate(true); err == nil {
		t.Error("create tanpa nama harus gagal")
	}
	if err := (WorkProgramInput{Name: sp("Kongres")}).Validate(true); err != nil {
		t.Error(err)
	}
}

func TestValidateLandingSections(t *testing.T) {
	ok := []string{"", "  ", `{}`, `{"about":false,"cta":true}`}
	for _, s := range ok {
		if _, err := ValidateLandingSections(s); err != nil {
			t.Errorf("%q should be valid: %v", s, err)
		}
	}
	if got, _ := ValidateLandingSections(` {"about":false} `); got != `{"about":false}` {
		t.Errorf("harus di-trim, got %q", got)
	}
	bad := []string{`[]`, `null`, `"x"`, `{"hero":false}`, `{"about":"no"}`, `{"about":1}`, `{bad`, `{} {}`}
	for _, s := range bad {
		if _, err := ValidateLandingSections(s); err == nil {
			t.Errorf("%q should be invalid", s)
		}
	}
}

func TestWorkProgramValidateDetail(t *testing.T) {
	bad := []WorkProgramInput{
		{Category: sp("lain")},
		{Status: sp("x")},
		{StartDate: sp("2026-13-01")},
		{DivisionID: sp("abc")},
		{StartDate: sp("2026-05-10"), EndDate: sp("2026-05-09")},
	}
	for i, in := range bad {
		if err := in.Validate(false); err == nil {
			t.Errorf("kasus %d harus gagal", i)
		}
	}
	ok := WorkProgramInput{Category: sp("agenda"), Status: sp("done"), DivisionID: sp(""),
		StartDate: sp("2026-05-10"), EndDate: sp("2026-05-10")}
	if err := ok.Validate(false); err != nil {
		t.Error(err)
	}
	if Slugify("Kongres Nasional ke-2!", 170) != "kongres-nasional-ke-2" {
		t.Error("slugify")
	}
}

func TestSortWorkPrograms(t *testing.T) {
	d := func(s string) *time.Time { x, _ := time.Parse("2006-01-02", s); return &x }
	mk := func(id int64, st string, date *time.Time) *models.WorkProgram {
		p := &models.WorkProgram{Status: st, StartDate: date}
		p.ID = id
		return p
	}
	l := []*models.WorkProgram{
		mk(1, "done", d("2026-01-01")), mk(2, "upcoming", nil), mk(3, "upcoming", d("2026-09-01")),
		mk(4, "upcoming", d("2026-08-01")), mk(5, "done", d("2026-03-01")),
	}
	SortWorkPrograms(l)
	var got []int64
	for _, p := range l {
		got = append(got, p.ID)
	}
	want := []int64{4, 3, 2, 5, 1}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v want %v", got, want)
		}
	}
}
