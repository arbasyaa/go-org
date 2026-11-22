package services

import "testing"

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
